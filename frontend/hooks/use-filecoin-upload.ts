"use client"

import { checkUploadReadiness, executeUpload } from 'filecoin-pin/core/upload'
import pino from 'pino'
import { useCallback, useState } from 'react'
import { storeDataSetId } from '../lib/local-storage/data-set'
import type { StepState } from '../types/upload/step'
import { useFilecoinPinContext } from './use-filecoin-pin-context'
import { useWaitableRef } from './use-waitable-ref'
import type { WalletSnapshot } from '../lib/filecoin-pin/wallet'

interface UploadState {
  isUploading: boolean
  stepStates: StepState[]
  error?: string
  currentCid?: string
  pieceCid?: string
  transactionHash?: string
}

const logger = pino({
  level: 'debug',
  browser: {
    asObject: true,
  },
})

export const INITIAL_STEP_STATES: StepState[] = [
  { step: 'creating-car', progress: 0, status: 'pending' },
  { step: 'checking-readiness', progress: 0, status: 'pending' },
  { step: 'uploading-car', progress: 0, status: 'pending' },
  { step: 'announcing-cids', progress: 0, status: 'pending' },
  { step: 'finalizing-transaction', progress: 0, status: 'pending' },
]

export const useFilecoinUpload = () => {
  const { synapse, storageContext, providerInfo, wallet } = useFilecoinPinContext()

  const storageContextRef = useWaitableRef(storageContext)
  const providerInfoRef = useWaitableRef(providerInfo)
  const synapseRef = useWaitableRef(synapse)

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    stepStates: INITIAL_STEP_STATES,
  })

  const updateStepState = useCallback((step: StepState['step'], updates: Partial<StepState>) => {
    setUploadState((prev) => ({
      ...prev,
      stepStates: prev.stepStates.map((stepState) =>
        stepState.step === step ? { ...stepState, ...updates } : stepState
      ),
    }))
  }, [])

  const uploadFile = useCallback(
    async (file: File, metadata?: Record<string, string>): Promise<string> => {
      setUploadState({
        isUploading: true,
        stepStates: INITIAL_STEP_STATES,
      })

      try {
        updateStepState('creating-car', { status: 'in-progress', progress: 0 })

        let carResult: any
        
        try {
          const unixfsModule = await import('filecoin-pin/core/unixfs')
          const createCarFromFile = (unixfsModule as any).createCarFromFile
          const createCarFromPath = (unixfsModule as any).createCarFromPath
          
          if (typeof createCarFromFile === 'function') {
            carResult = await createCarFromFile(file, {
              onProgress: (bytesProcessed: number, totalBytes: number) => {
                const progressPercent = Math.round((bytesProcessed / totalBytes) * 100)
                updateStepState('creating-car', { progress: progressPercent })
              },
            })
          } else if (typeof createCarFromPath === 'function') {
            try {
              carResult = await createCarFromPath(file as any)
              updateStepState('creating-car', { progress: 100 })
            } catch (error) {
              const blobUrl = URL.createObjectURL(file)
              try {
                carResult = await createCarFromPath(blobUrl)
                updateStepState('creating-car', { progress: 100 })
              } finally {
                URL.revokeObjectURL(blobUrl)
              }
            }
          } else {
            const availableExports = Object.keys(unixfsModule).join(', ')
            throw new Error(
              `No CAR creation function available. Available exports: ${availableExports}. ` +
              `createCarFromFile: ${typeof createCarFromFile}, createCarFromPath: ${typeof createCarFromPath}`
            )
          }
        } catch (carError) {
          setUploadState({
            isUploading: false,
            stepStates: INITIAL_STEP_STATES,
          })
          return ''
        }

        const rootCid = carResult.rootCid.toString()
        setUploadState((prev) => ({
          ...prev,
          currentCid: rootCid,
        }))

        updateStepState('creating-car', { status: 'completed', progress: 100 })

        updateStepState('checking-readiness', { status: 'in-progress', progress: 0 })
        updateStepState('uploading-car', { status: 'in-progress', progress: 0 })
        const synapse = await synapseRef.wait()
        updateStepState('checking-readiness', { progress: 50 })

        const carSize = (carResult as any).carBytes?.length ?? file.size
        const readinessCheck = await checkUploadReadiness({
          synapse,
          fileSize: carSize,
          autoConfigureAllowances: true,
        })

        if (readinessCheck.status === 'blocked') {
          throw new Error('Readiness check failed')
        }

        updateStepState('checking-readiness', { status: 'completed', progress: 100 })
        const [currentStorageContext, currentProviderInfo] = await Promise.all([
          storageContextRef.wait(),
          providerInfoRef.wait(),
        ])

        const initialDataSetId = currentStorageContext.dataSetId

        const synapseService = {
          storage: currentStorageContext,
          providerInfo: currentProviderInfo,
          synapse,
        }

        const carBytes = (carResult as any).carBytes ?? await file.arrayBuffer()
        const carBytesArray = carBytes instanceof ArrayBuffer ? new Uint8Array(carBytes) : carBytes
        
        try {
          await executeUpload(synapseService, carBytesArray, carResult.rootCid, {
            logger,
            contextId: `upload-${Date.now()}`,
            metadata: {
              ...(metadata ?? {}),
              label: file.name,
            },
            onProgress: (event) => {
              switch (event.type) {
                case 'onUploadComplete':
                  const pieceCid = event.data.pieceCid
                  if (pieceCid) {
                    const pieceCidString = pieceCid.toString()
                    setUploadState((prev) => ({
                      ...prev,
                      pieceCid: pieceCidString,
                    }))
                  }
                  updateStepState('uploading-car', { status: 'completed', progress: 100 })
                  updateStepState('announcing-cids', { status: 'in-progress', progress: 0 })
                  break

                case 'onPieceAdded': {
                  const txHash = event.data.txHash
                  if (txHash) {
                    setUploadState((prev) => ({
                      ...prev,
                      transactionHash: txHash,
                    }))
                  }
                  updateStepState('finalizing-transaction', { status: 'in-progress', progress: 0 })
                  break
                }

                case 'onPieceConfirmed': {
                  const currentDataSetId = currentStorageContext.dataSetId
                  if (wallet?.status === 'ready' && currentDataSetId !== undefined && initialDataSetId === undefined) {
                    const walletWithData = wallet as unknown as { status: 'ready'; data: WalletSnapshot }
                    storeDataSetId(walletWithData.data.address, currentDataSetId)
                  }
                  updateStepState('finalizing-transaction', { status: 'completed', progress: 100 })
                  break
                }
                case 'ipniProviderResults.complete': {
                  updateStepState('announcing-cids', { status: 'completed', progress: 100 })
                  break
                }
                case 'ipniProviderResults.failed': {
                  updateStepState('announcing-cids', {
                    status: 'error',
                    progress: 0,
                    error: "CID not yet indexed by IPNI. It's stored on Filecoin and fetchable now, but may take time to appear on IPFS.",
                  })
                  break
                }
                default:
                  break
              }
            },
          })
        } catch (uploadError) {
          setUploadState({
            isUploading: false,
            stepStates: INITIAL_STEP_STATES,
          })
          return ''
        }

        return rootCid
      } catch (error) {
        setUploadState({
          isUploading: false,
          stepStates: INITIAL_STEP_STATES,
        })
        return ''
      } finally {
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
        }))
      }
    },
    [updateStepState, synapseRef, storageContextRef, providerInfoRef, wallet]
  )

  const resetUpload = useCallback(() => {
    setUploadState({
      isUploading: false,
      stepStates: INITIAL_STEP_STATES,
      currentCid: undefined,
      pieceCid: undefined,
      transactionHash: undefined,
    })
  }, [])

  return {
    uploadState,
    uploadFile,
    resetUpload,
  }
}
