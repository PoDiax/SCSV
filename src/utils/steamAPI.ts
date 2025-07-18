import type { SteamAPIResponse } from '@/types'

export class SteamAPI {
  private static readonly BASE_URL = 'https://api.steampowered.com'
  private static readonly COLLECTION_ENDPOINT = '/ISteamRemoteStorage/GetCollectionDetails/v1/'
  private static readonly FILE_DETAILS_ENDPOINT = '/ISteamRemoteStorage/GetPublishedFileDetails/v1/'

  static async getCollectionDetails(collectionId: string): Promise<SteamAPIResponse> {
    const response = await fetch(`${this.BASE_URL}${this.COLLECTION_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        collectioncount: '1',
        'publishedfileids[0]': collectionId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch collection details: ${response.status}`)
    }

    return response.json()
  }

  static async getFileDetails(fileId: string): Promise<SteamAPIResponse> {
    const response = await fetch(`${this.BASE_URL}${this.FILE_DETAILS_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        itemcount: '1',
        'publishedfileids[0]': fileId,
      }),
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch file details: ${response.status}`)
    }

    return response.json()
  }

  static async likeItem(sessionId: string, itemId: string): Promise<any> {
    const response = await fetch('https://steamcommunity.com/sharedfiles/voteup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ sessionid: sessionId, id: itemId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to like item: ${response.status}`)
    }

    return response.json()
  }
}