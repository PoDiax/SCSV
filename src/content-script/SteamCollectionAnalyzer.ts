import browser from 'webextension-polyfill'

interface ItemSize {
  [key: string]: number | string
}

interface SteamAPIResponse {
  response: {
    collectiondetails: Array<{
      children: Array<{
        publishedfileid: string
      }>
    }>
    publishedfiledetails: Array<{
      file_size: number
      result: number
    }>
  }
}

export class SteamCollectionAnalyzer {
  private currentUrl = new URL(window.location.href)
  private id = this.currentUrl.searchParams.get('id')
  private useGB = false

  async init() {
    if (!this.id) {
      console.info('ID parameter not found in URL')
      return
    }

    await this.loadSettings()
    
    const isCollectionPage = await this.checkIfPageIsCollection()
    if (!isCollectionPage) {
      console.debug('Not a collection page')
      return
    }

    await this.createUI()
  }

  private async loadSettings() {
    try {
      const result = await browser.storage.local.get('useGB')
      this.useGB = typeof result.useGB === 'boolean' ? result.useGB : false;
    } catch (error) {
      console.warn('Error loading settings:', error)
      this.useGB = false
    }
  }

  private async checkIfPageIsCollection(): Promise<boolean> {
    if (!this.id) return false

    try {
      const response = await fetch(
        'https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            collectioncount: '1',
            'publishedfileids[0]': this.id,
          }),
        }
      )

      if (response.ok) {
        const data: SteamAPIResponse = await response.json()
        return !!(data.response?.collectiondetails?.[0]?.children)
      }
    } catch (error) {
      console.error('Error checking collection:', error)
    }

    return false
  }

  private async createUI() {
    const buttonLocations = Array.from(
      document.querySelectorAll('.workshopItemDescriptionTitle')
    )

    let buttonLocation = buttonLocations.find(div => 
      div.textContent?.includes('Items')
    )

    if (!buttonLocation) {
      buttonLocation = buttonLocations[1] || buttonLocations[0]
    }

    if (!buttonLocation) {
      console.debug('Button container not found')
      return
    }

    const calcButton = this.createButton('Calculate Size', '_calc _calcSpan')
    const likeAllButton = this.createButton('Like All', '_likeAll')

    try {
      const allItems = await this.getAllItems()
      
      this.setupCalculateButton(calcButton, allItems)
      await this.setupLikeAllButton(likeAllButton, allItems)

      buttonLocation.appendChild(calcButton)
      buttonLocation.appendChild(likeAllButton)
    } catch (error) {
      console.error('Error creating UI:', error)
    }
  }

  private createButton(text: string, className: string): HTMLSpanElement {
    const button = document.createElement('span')
    button.className = `general_btn ${className}`
    button.textContent = text
    return button
  }

  private setupCalculateButton(button: HTMLSpanElement, allItems: string[]) {
    button.onclick = async () => {
      if (button.classList.contains('scsv-loading')) return

      if (allItems.length > 0) {
        button.classList.add('scsv-loading')
        try {
          const totalSizeMb = await this.calculateWorkshopItemsSize(allItems)
          const totalSize = this.useGB 
            ? `${(totalSizeMb / 1024).toFixed(2)} GB` 
            : `${totalSizeMb} MB`

          button.textContent = totalSize
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-success')
          
          // Copy to clipboard
          try {
            await navigator.clipboard.writeText(totalSize)
          } catch (clipboardError) {
            console.warn('Could not copy to clipboard:', clipboardError)
          }

          setTimeout(() => {
            button.classList.remove('scsv-success')
          }, 2000)
        } catch (error) {
          console.error('Error calculating size:', error)
          button.textContent = 'Error'
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-error')
          
          setTimeout(() => {
            button.classList.remove('scsv-error')
            button.textContent = 'Calculate Size'
          }, 3000)
        }
      } else {
        console.debug('No workshop items found')
      }
    }
  }

  private async setupLikeAllButton(button: HTMLSpanElement, allItems: string[]) {
    button.onclick = async () => {
      if (button.classList.contains('scsv-loading')) return

      if (allItems.length > 0) {
        button.classList.add('scsv-loading')
        try {
          const liked = await this.likeAllItems(allItems)
          
          button.classList.remove('scsv-loading')
          
          if (liked > 0) {
            button.textContent = `Liked ${liked} items`
            button.classList.add('scsv-success')
          } else {
            button.textContent = 'Like All'
          }

          setTimeout(() => {
            button.classList.remove('scsv-success')
          }, 3000)
        } catch (error) {
          console.error('Error liking items:', error)
          button.textContent = 'Error'
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-error')
          
          setTimeout(() => {
            button.classList.remove('scsv-error')
            button.textContent = 'Like All'
          }, 3000)
        }
      } else {
        console.debug('No workshop items found')
      }
    }

    // Check if all items are already liked
    try {
      const storageKey = `likedItems_${this.id}`
      const result = await browser.storage.local.get(storageKey)
      const likedItems = Array.isArray(result[storageKey]) ? result[storageKey] : [];

      
      const allLiked = allItems.every(item => likedItems.includes(item))
      
      if (allLiked && allItems.length > 0) {
        button.textContent = 'All Liked'
        button.style.opacity = '0.7'
      }
    } catch (error) {
      console.warn('Error checking liked status:', error)
    }
  }

  private async getAllItems(): Promise<string[]> {
    try {
      if (!this.id) return []

      const response = await fetch(
        'https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            collectioncount: '1',
            'publishedfileids[0]': this.id,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to fetch collection details')
      }

      const data: SteamAPIResponse = await response.json()
      const collectionDetails = data.response?.collectiondetails

      if (!collectionDetails || collectionDetails.length === 0) {
        throw new Error('No collection details found')
      }

      return collectionDetails[0].children?.map(item => item.publishedfileid) || []
    } catch (error) {
      console.warn('Error with new method, falling back to old method:', error)
      return this.fallbackGetAllItems()
    }
  }

  private fallbackGetAllItems(): string[] {
    const itemsContainer = document.querySelector('.collectionChildren')
    const items: string[] = []

    if (itemsContainer) {
      const collectionItems = itemsContainer.querySelectorAll('div.collectionItem')
      for (const item of collectionItems) {
        if (item.id && item.id.startsWith('sharedfile_')) {
          const fileId = item.id.replace('sharedfile_', '')
          items.push(fileId)
        }
      }
    }

    return items
  }

  private async calculateWorkshopItemsSize(workshopItemIds: string[]): Promise<number> {
    let totalSizeMb = 0
    const itemSizes: ItemSize = {}

    console.info('Calculating workshop item sizes...')

    await Promise.all(
      workshopItemIds.map(async (workshopItemId) => {
        try {
          const response = await fetch(
            'https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                itemcount: '1',
                'publishedfileids[0]': workshopItemId,
              }),
            }
          )

          const responseData: SteamAPIResponse = await response.json()

          if (responseData.response?.publishedfiledetails?.[0]) {
            const fileDetails = responseData.response.publishedfiledetails[0]
            const fileSizeBytes = fileDetails.file_size
            const fileSizeMb = fileSizeBytes / (1024 * 1024)

            if (!isNaN(fileSizeMb) && isFinite(fileSizeMb)) {
              totalSizeMb += fileSizeMb
              itemSizes[workshopItemId] = fileSizeBytes
            } else {
              console.warn(`Invalid size for item ${workshopItemId}`)
              itemSizes[workshopItemId] = 'N/A'
            }
          } else {
            console.error(`Invalid response for item ${workshopItemId}`)
            itemSizes[workshopItemId] = 'N/A'
          }
        } catch (error) {
          console.error(`Error processing item ${workshopItemId}:`, error)
          itemSizes[workshopItemId] = 'N/A'
        }
      })
    )

    this.displayItemSizes(itemSizes)
    return parseFloat(totalSizeMb.toFixed(2))
  }

  private displayItemSizes(itemSizes: ItemSize) {
    const addons = document.querySelectorAll('.collectionItem')
    
    addons.forEach((addon) => {
      const addonId = addon.id.replace('sharedfile_', '')
      const titleElement = addon.querySelector('.workshopItemTitle')
      
      if (titleElement && itemSizes[addonId] && itemSizes[addonId] !== 'N/A') {
        // Remove existing size display
        const existingSize = titleElement.querySelector('.item-size')
        if (existingSize) {
          existingSize.remove()
        }

        const sizeSpan = document.createElement('span')
        sizeSpan.className = 'item-size'
        
        const sizeBytes = itemSizes[addonId] as number
        let displaySize: string

        if (sizeBytes < 1024) {
          displaySize = `${sizeBytes} B`
        } else if (sizeBytes < 1024 * 1024) {
          displaySize = `${(sizeBytes / 1024).toFixed(2)} KB`
        } else if (sizeBytes < 1024 * 1024 * 1024) {
          displaySize = `${(sizeBytes / (1024 * 1024)).toFixed(2)} MB`
        } else {
          displaySize = `${(sizeBytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
        }
        
        sizeSpan.textContent = `(${displaySize})`
        titleElement.appendChild(sizeSpan)
      }
    })
  }

  private async likeAllItems(workshopItemIds: string[]): Promise<number> {
    if (!this.checkUserLoggedIn()) {
      alert('You need to be logged in to like items.')
      return 0
    }

    const sessionId = this.getSessionId()
    if (!sessionId) {
      console.warn('Session ID not found')
      return 0
    }

    const storageKey = `likedItems_${this.id}`
    const result = await browser.storage.local.get(storageKey)
  const likedItems = new Set<string>(Array.isArray(result[storageKey]) ? result[storageKey] : []);

    let successCount = 0
    let failureCount = 0
    let status15Timestamps: number[] = []

    for (const itemId of workshopItemIds) {
      if (likedItems.has(itemId)) {
        continue
      }

      try {
        const response = await fetch('https://steamcommunity.com/sharedfiles/voteup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ sessionid: sessionId, id: itemId }),
        })

        if (!response.ok) {
          failureCount++
          continue
        }

        const data = await response.json()

        if (data.success === 15 || Object.values(data.results ?? {}).includes(15)) {
          failureCount++
          const now = Date.now()
          status15Timestamps.push(now)
          status15Timestamps = status15Timestamps.filter(ts => now - ts <= 5000)
          
          if (status15Timestamps.length >= 5) {
            alert('Many items are private/hidden or you do not own the game!')
            break
          }
          continue
        }

        if (data.success === 1) {
          successCount++
          likedItems.add(itemId)
          await browser.storage.local.set({ [storageKey]: [...likedItems] })
        } else {
          failureCount++
        }
      } catch (error) {
        console.error(`Error liking item ${itemId}:`, error)
        failureCount++
      }
    }

    console.info(`Liked ${successCount} items, failed ${failureCount} times`)
    return successCount
  }

  private checkUserLoggedIn(): boolean {
    const accountElement = document.getElementById('account_pulldown')
    return !!(accountElement && accountElement.textContent?.trim())
  }

  private getSessionId(): string | null {
    const cookies = document.cookie.split('; ')
    const sessionCookie = cookies.find(cookie => cookie.startsWith('sessionid='))
    return sessionCookie ? sessionCookie.split('=')[1] : null
  }
}