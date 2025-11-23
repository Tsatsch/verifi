export interface Measurement {
  id: string
  lat: number
  lng: number
  strength: 'strong' | 'weak' | 'dead'
  ssid: string
  speed: number
  verified: number
  timestamp?: string
  walletAddress?: string
}

export interface MeasurementData {
  location: { lat: number; lng: number }
  speed: number
  time: string
  wifiName: string
  walletAddress: string
}
