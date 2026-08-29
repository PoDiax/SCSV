export interface SteamCollectionInfo {
  publishedfileid: string
  title: string
  app_name: string
  num_children: number
  children: Array<{ publishedfileid: string; file_type: number }>
}

export class CollectionService {
  /**
   * Fetches the current user's session ID and Steam ID by parsing the Steam homepage.
   */
  static async getCurrentUser(): Promise<{ sessionId: string; steamId: string } | null> {
    try {
      const response = await fetch('https://steamcommunity.com/')
      if (!response.ok) return null

      const text = await response.text()
      const sessionMatch = text.match(/g_sessionID\s*=\s*["']([^"']+)["']/)
      const steamIdMatch = text.match(/g_steamID\s*=\s*["']([^"']+)["']/)
      
      if (sessionMatch && steamIdMatch) {
        return {
          sessionId: sessionMatch[1],
          steamId: steamIdMatch[1]
        }
      }
      return null
    } catch (error) {
      console.error('Failed to get Steam current user:', error)
      return null
    }
  }

  /**
   * Fetches all collections for the logged-in user.
   */
  static async getCollections(appId?: string): Promise<SteamCollectionInfo[]> {
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Not logged into Steam')
    }

    const body = new URLSearchParams()
    if (appId) {
      body.append('appid', appId)
    }
    body.append('sessionid', user.sessionId)

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
    const user = await this.getCurrentUser()
    if (!user) {
      throw new Error('Not logged into Steam')
    }

    const body = new URLSearchParams()
    body.append('sessionID', user.sessionId)
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
