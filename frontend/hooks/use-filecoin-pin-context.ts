import { useContext } from 'react'
import { FilecoinPinContext } from '../context/filecoin-pin-provider'

export function useFilecoinPinContext() {
  const context = useContext(FilecoinPinContext)

  if (!context) {
    throw new Error('useFilecoinPinContext must be used within FilecoinPinProvider')
  }

  return context
}

