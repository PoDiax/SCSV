export interface SteamCollectionInfo {
  publishedfileid: string
  title: string
  app_name: string
  num_children: number
  children: Array<{ publishedfileid: string; file_type: number }>
}

export class CollectionService {
  /**
   * Fetches the current user's session ID by parsing the Steam homepage.
   */
  static async getSessionId(): Promise<string | null> {
    try {
      const response = await fetch('https://steamcommunity.com/')
      if (!response.ok) return null

      const text = await response.text()
      // Extract g_sessionID from the script tag
      const match = text.match(/g_sessionID\s*=\s*["']([^"']+)["']/)
      return match ? match[1] : null
    } catch (error) {
      console.error('Failed to get Steam session ID:', error)
      return null
    }
  }

  /**
   * Fetches all collections for the logged-in user.
   */
  static async getCollections(appId?: string): Promise<SteamCollectionInfo[]> {
    const sessionId = await this.getSessionId()
    if (!sessionId) {
      throw new Error('Not logged into Steam')
    }

    const body = new URLSearchParams()
    if (appId) {
      body.append('appid', appId)
    }
    body.append('sessionid', sessionId)

    const response = await fetch('https://steamcommunity.com/sharedfiles/ajaxgetmycollections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    if (!data?.all_collections?.publishedfiledetails) {
      return []
    }

    return data.all_collections.publishedfiledetails
  }

  /**
   * Toggles an item in a collection (adds or removes).
   */
  static async toggleItemInCollection(
    collectionId: string,
    collectionTitle: string,
    itemId: string,
    action: 'add' | 'remove'
  ): Promise<boolean> {
    const sessionId = await this.getSessionId()
    if (!sessionId) {
      throw new Error('Not logged into Steam')
    }

    const body = new URLSearchParams()
    body.append('sessionID', sessionId)
    body.append('publishedfileid', itemId)
    body.append(`collections[${collectionId}][${action}]`, 'true')
    body.append(`collections[${collectionId}][title]`, collectionTitle)

    const response = await fetch('https://steamcommunity.com/sharedfiles/ajaxaddtocollections', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: body.toString(),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()
    return data.success === 1
  }
}
