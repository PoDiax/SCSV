export interface SteamPublishedFileDetail {
  result: number
  publishedfileid: string
  file_size?: string
}

export interface SteamCollectionDetail {
  publishedfileid: string
  result: number
  children?: Array<{
    publishedfileid: string
    sortorder: number
    file_type: number
  }>
}

export interface SteamAPIResponse {
  response?: {
    result: number
    resultcount: number
    publishedfiledetails?: SteamPublishedFileDetail[]
    collectiondetails?: SteamCollectionDetail[]
  }
}

export class SteamAPI {
  /**
   * Calculates the total size of a list of Workshop item IDs in Megabytes (MB)
   * and returns the individual byte sizes for each item.
   */
  static async calculateWorkshopItemsSize(items: string[]): Promise<{ totalSizeMb: number; itemSizes: Record<string, number | string> }> {
    const CHUNK_SIZE = 100
    let totalSizeMb = 0
    const itemSizes: Record<string, number | string> = {}

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE)
      const body = new URLSearchParams({
        itemcount: chunk.length.toString(),
      })

      chunk.forEach((id, index) => {
        body.append(`publishedfileids[${index}]`, id)
      })

      try {
        const response = await fetch(
          'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          }
        )

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }

        const data: SteamAPIResponse = await response.json()
        const details = data.response?.publishedfiledetails

        if (details) {
          details.forEach(item => {
            if (item.result === 1 && item.file_size) {
              const sizeBytes = parseInt(item.file_size)
              totalSizeMb += sizeBytes / (1024 * 1024)
              itemSizes[item.publishedfileid] = sizeBytes
            } else {
              itemSizes[item.publishedfileid] = 'N/A'
            }
          })
        }
      } catch (error) {
        console.error('Failed to fetch size for chunk:', error)
        chunk.forEach(id => {
          if (!itemSizes[id]) itemSizes[id] = 'N/A'
        })
      }
    }

    return { totalSizeMb, itemSizes }
  }
}
