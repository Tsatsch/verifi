import type { SynapseService } from 'filecoin-pin/core/synapse'
import { useCallback, useRef, useState } from 'react'
import type { StorageContextHelperResult } from '../lib/filecoin-pin/storage-context-helper'
import {
  createStorageContextForNewDataSet,
  createStorageContextFromDataSetId,
} from '../lib/filecoin-pin/storage-context-helper'
import { getStoredDataSetId } from '../lib/local-storage/data-set'

type ProviderInfo = SynapseService['providerInfo']
type StorageContext = StorageContextHelperResult['storage']

export type DataSetState =
  | { status: 'idle'; dataSetId?: number }
  | { status: 'initializing'; dataSetId?: number }
  | { status: 'ready'; dataSetId: number | null; storageContext: StorageContext; providerInfo: ProviderInfo }
  | { status: 'error'; error: string; dataSetId?: number }

interface UseDataSetManagerProps {
  synapse: SynapseService['synapse'] | null
  walletAddress: string | null
  debugParams?: {
    providerId?: number | null
    dataSetId?: number | null
  }
}

interface UseDataSetManagerReturn {
  dataSet: DataSetState
  checkIfDatasetExists: () => Promise<number | null>
  storageContext: StorageContext | null
  providerInfo: ProviderInfo | null
}

export function useDataSetManager({
  synapse,
  walletAddress,
  debugParams,
}: UseDataSetManagerProps): UseDataSetManagerReturn {
  const [dataSet, setDataSet] = useState<DataSetState>({ status: 'idle' })
  const isCheckingDataSetRef = useRef<boolean>(false)

  const checkIfDatasetExists = useCallback(async (): Promise<number | null> => {
    if (isCheckingDataSetRef.current) {
      return new Promise<number | null>((resolve) => {
        setDataSet((current) => {
          resolve(current.dataSetId ?? null)
          return current
        })
      })
    }

    if (!walletAddress) {
      return null
    }

    if (!synapse) {
      return null
    }

    const shouldProceed = await new Promise<boolean>((resolve) => {
      setDataSet((current) => {
        if (current.status === 'ready' && current.dataSetId) {
          resolve(false)
          return current
        }

        if (current.status === 'initializing') {
          resolve(false)
          return current
        }

        resolve(true)
        return current
      })
    })

    if (!shouldProceed) {
      return new Promise<number | null>((resolve) => {
        setDataSet((current) => {
          resolve(current.dataSetId ?? null)
          return current
        })
      })
    }

    isCheckingDataSetRef.current = true

    try {
      const urlDataSetId = debugParams?.dataSetId ?? null
      const urlProviderId = debugParams?.providerId ?? null
      const hasUrlOverrides = urlDataSetId !== null || urlProviderId !== null

      const storedDataSetId = hasUrlOverrides ? null : getStoredDataSetId(walletAddress)

      const effectiveDataSetId = urlDataSetId ?? storedDataSetId

      setDataSet(() => ({
        status: 'initializing',
        dataSetId: effectiveDataSetId ?? undefined,
      }))

      try {
        if (effectiveDataSetId !== null) {
          const { storage, providerInfo } = await createStorageContextFromDataSetId(synapse, effectiveDataSetId)
          setDataSet({
            status: 'ready',
            dataSetId: effectiveDataSetId,
            storageContext: storage,
            providerInfo,
          })
          return effectiveDataSetId
        }

        const { storage, providerInfo } = await createStorageContextForNewDataSet(synapse, {
          providerId: urlProviderId ?? undefined,
        })
        const resolvedDataSetId = storage.dataSetId ?? null
        setDataSet({
          status: 'ready',
          dataSetId: resolvedDataSetId,
          storageContext: storage,
          providerInfo,
        })
        return resolvedDataSetId
      } catch (error) {
        console.error('[DataSet] Failed to check data set:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to check data set'
        setDataSet(() => ({
          status: 'error',
          error: errorMessage,
        }))
        return null
      }
    } finally {
      isCheckingDataSetRef.current = false
    }
  }, [walletAddress, synapse, debugParams])

  return {
    dataSet,
    checkIfDatasetExists,
    storageContext: dataSet.status === 'ready' ? dataSet.storageContext : null,
    providerInfo: dataSet.status === 'ready' ? dataSet.providerInfo : null,
  }
}
