/**
 * Helper: createStorageContextFromDataSetId
 *
 * Optimized helper to create a StorageContext for an existing dataset ID without
 * triggering the expensive "scan all client datasets" hotpath.
 */

import type { Synapse, WarmStorageService } from '@filoz/synapse-sdk'
import { StorageContext } from '@filoz/synapse-sdk'
import { type ProviderInfo, SPRegistryService } from '@filoz/synapse-sdk/sp-registry'
import { DEFAULT_DATA_SET_METADATA, DEFAULT_STORAGE_CONTEXT_CONFIG } from 'filecoin-pin/core/synapse'
import pino from 'pino'

const logger = pino({
  level: 'debug',
  browser: {
    asObject: true,
  },
})

export type StorageContextHelperResult = {
  storage: StorageContext
  providerInfo: ProviderInfo
}

/**
 * Create a StorageContext for an existing dataSetId without scanning all datasets.
 */
export async function createStorageContextFromDataSetId(
  synapse: Synapse,
  dataSetId: number
): Promise<StorageContextHelperResult> {
  // @ts-expect-error - Accessing private _warmStorageService temporarily until SDK is updated
  const warmStorage = synapse.storage._warmStorageService
  if (!warmStorage) {
    throw new Error('WarmStorageService not available on Synapse instance')
  }

  const [dataSetInfo] = await Promise.all([warmStorage.getDataSet(dataSetId), warmStorage.validateDataSet(dataSetId)])

  const signerAddress = await synapse.getClient().getAddress()
  if (dataSetInfo.payer.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(`Data set ${dataSetId} is not owned by ${signerAddress} (owned by ${dataSetInfo.payer})`)
  }

  const registryAddress = warmStorage.getServiceProviderRegistryAddress()
  const spRegistry = new SPRegistryService(synapse.getProvider(), registryAddress)

  const isProviderApproved = await warmStorage.isProviderIdApproved(dataSetInfo.providerId)
  if (!isProviderApproved) {
    logger.warn(
      { providerId: dataSetInfo.providerId },
      `Data set ${dataSetId} is not owned by an approved provider, creating a new one`
    )
    return await createStorageContextForNewDataSet(synapse)
  }

  const [providerInfo, dataSetMetadata] = await Promise.all([
    spRegistry.getProvider(dataSetInfo.providerId),
    warmStorage.getDataSetMetadata(dataSetId),
  ])

  if (providerInfo == null) {
    throw new Error(`Unable to resolve provider info for data set ${dataSetId} and provider ${dataSetInfo.providerId}`)
  }

  const withCDN = dataSetInfo.cdnRailId > 0
  const storageContext = new StorageContext(synapse, warmStorage, providerInfo, dataSetId, { withCDN }, dataSetMetadata)

  return {
    storage: storageContext,
    providerInfo,
  }
}

export type CreateNewStorageContextOptions = {
  providerId?: number
  providerAddress?: string
  warmStorage?: WarmStorageService
  spRegistry?: SPRegistryService
}

/**
 * Create a StorageContext configured for creating a brand new dataset without scanning all
 * existing datasets. Provider selection favors explicit overrides and otherwise randomly selects
 * an active provider that exposes a PDP endpoint.
 */
export async function createStorageContextForNewDataSet(
  synapse: Synapse,
  options: CreateNewStorageContextOptions = {}
): Promise<StorageContextHelperResult> {
  // @ts-expect-error - Accessing private _warmStorageService temporarily until SDK is updated
  const warmStorage = options.warmStorage ?? synapse.storage._warmStorageService
  if (!warmStorage) {
    throw new Error('WarmStorageService not available on Synapse instance')
  }

  const registryAddress = warmStorage.getServiceProviderRegistryAddress()
  const spRegistry = options.spRegistry ?? new SPRegistryService(synapse.getProvider(), registryAddress)

  const providerInfo = await getApprovedProviderInfo(warmStorage, spRegistry, options.providerId)

  const mergedMetadata = { ...DEFAULT_DATA_SET_METADATA }

  const storageOptions = {
    ...DEFAULT_STORAGE_CONTEXT_CONFIG,
    metadata: mergedMetadata,
  }

  const storageContext = new StorageContext(
    synapse,
    warmStorage,
    providerInfo,
    undefined,
    storageOptions,
    mergedMetadata
  )

  return {
    storage: storageContext,
    providerInfo,
  }
}

async function getApprovedProviderInfo(
  warmStorage: WarmStorageService,
  spRegistry: SPRegistryService,
  providerId?: number
): Promise<ProviderInfo> {
  let providerInfo: ProviderInfo | null = null

  if (providerId != null) {
    const isProviderApproved = await warmStorage.isProviderIdApproved(providerId)
    if (!isProviderApproved) {
      logger.warn(
        { providerId },
        `Presuming given providerId ${providerId} is a queryParam and allowing creation to continue with a non-approved provider`
      )
    }
    providerInfo = await spRegistry.getProvider(providerId)
  } else {
    const approvedProviderIds = await warmStorage.getApprovedProviderIds()
    if (approvedProviderIds.length === 0) {
      throw new Error('No approved storage providers available for new data set creation')
    }
    const randomApprovedProviderId = approvedProviderIds[Math.floor(Math.random() * approvedProviderIds.length)]
    providerInfo = await spRegistry.getProvider(randomApprovedProviderId)
  }

  if (providerInfo == null) {
    throw new Error(`Unable to resolve an approved storage provider for new data set creation`)
  }

  return providerInfo
}
