import { initializeSynapse, type SynapseService } from 'filecoin-pin/core/synapse'
import pino from 'pino'
import type { SynapseSetupConfig } from 'filecoin-pin/core/synapse'

const logger = pino({
  level: 'debug',
  browser: {
    asObject: true,
  },
})

let synapsePromise: Promise<SynapseService['synapse']> | null = null

export const getSynapseClient = (config: SynapseSetupConfig) => {
  if (!synapsePromise) {
    synapsePromise = initializeSynapse(
      {
        ...config,
        telemetry: {
          sentrySetTags: {
            appName: 'verifi',
            verifiDomain: typeof window !== 'undefined' ? window.location.origin : '',
          },
        },
      },
      logger
    )
  }

  return synapsePromise
}

export const resetSynapseClient = () => {
  synapsePromise = null
}

