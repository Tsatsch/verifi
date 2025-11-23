/**
 * LocalStorage helpers for managing data set IDs scoped per wallet address.
 */

const DATA_SET_ID_KEY = 'filecoin-pin-data-set-id-v2'

const getDataSetStorageKey = (walletAddress: string, providerId?: number): string => {
  if (providerId) {
    return `${DATA_SET_ID_KEY}-${walletAddress}-provider-${providerId}`
  }
  return `${DATA_SET_ID_KEY}-${walletAddress}`
}

export const getStoredDataSetId = (walletAddress: string): number | null => {
  try {
    const key = getDataSetStorageKey(walletAddress)
    const storedId = localStorage.getItem(key)
    return storedId ? Number.parseInt(storedId, 10) : null
  } catch (error) {
    console.warn('[DataSetStorage] Failed to read data set ID from localStorage:', error)
    return null
  }
}

export const storeDataSetId = (walletAddress: string, dataSetId: number): void => {
  try {
    const key = getDataSetStorageKey(walletAddress)
    localStorage.setItem(key, dataSetId.toString())
  } catch (error) {
    console.warn('[DataSetStorage] Failed to store data set ID in localStorage:', error)
  }
}

export const getStoredDataSetIdForProvider = (walletAddress: string, providerId: number): number | null => {
  try {
    const key = getDataSetStorageKey(walletAddress, providerId)
    const storedId = localStorage.getItem(key)
    return storedId ? Number.parseInt(storedId, 10) : null
  } catch (error) {
    console.warn('[DataSetStorage] Failed to read data set ID from localStorage:', error)
    return null
  }
}

export const storeDataSetIdForProvider = (walletAddress: string, providerId: number, dataSetId: number): void => {
  try {
    const key = getDataSetStorageKey(walletAddress, providerId)
    localStorage.setItem(key, dataSetId.toString())
  } catch (error) {
    console.warn('[DataSetStorage] Failed to store data set ID in localStorage:', error)
  }
}
