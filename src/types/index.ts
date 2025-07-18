export interface SteamAPIResponse {
  response: {
    collectiondetails?: Array<{
      children: Array<{
        publishedfileid: string
      }>
    }>
    publishedfiledetails?: Array<{
      file_size: number
      result: number
      title?: string
    }>
  }
}

export interface ItemSize {
  [key: string]: number | string
}

export interface ExtensionStorage {
  useGB?: boolean
  [key: `likedItems_${string}`]: string[]
}

export interface LikeResponse {
  success: number
  results?: { [key: string]: number }
}

export type StatusType = 'success' | 'error' | 'info' | 'warning'

export interface StatusMessage {
  message: string
  type: StatusType
  timestamp: number
}