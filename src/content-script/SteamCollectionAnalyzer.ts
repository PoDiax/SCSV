import browser from 'webextension-polyfill'

import { SteamAPI, SteamAPIResponse } from '../shared/SteamAPI'
import { CollectionService } from '../shared/CollectionService'

interface ItemSize {
  [key: string]: number | string
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

    if (document.querySelector('.collectionChildren')) {
      return true
    }

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

    const calcButton = this.createButton(browser.i18n.getMessage('content_calc_size'), '_calc _calcSpan')
    const likeAllButton = this.createButton(browser.i18n.getMessage('content_like_all'), '_likeAll')

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
    button.className = `general_btn scsv-design ${className}`
    button.textContent = text
    return button
  }

  private setupCalculateButton(button: HTMLSpanElement, allItems: string[]) {
    button.onclick = async () => {
      if (button.classList.contains('scsv-loading') || button.dataset.calculated) return

      if (allItems.length > 0) {
        button.classList.add('scsv-loading')
        try {
          const { totalSizeMb, itemSizes } = await SteamAPI.calculateWorkshopItemsSize(allItems)
          
          this.displayItemSizes(itemSizes)

          const totalSize = this.useGB 
            ? `${(totalSizeMb / 1024).toFixed(2)} GB` 
            : `${totalSizeMb.toFixed(2)} MB`

          button.textContent = totalSize
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-success')
          button.dataset.calculated = 'true'
          button.style.cursor = 'default'
          
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
          button.textContent = browser.i18n.getMessage('content_error')
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-error')
          
          setTimeout(() => {
            button.classList.remove('scsv-error')
            button.textContent = browser.i18n.getMessage('content_calc_size')
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
          const liked = await this.likeAllItems(allItems, (current, total) => {
            button.setAttribute('data-progress', `${current}/${total}`)
          })
          
          button.classList.remove('scsv-loading')
          button.removeAttribute('data-progress')
          
          if (liked > 0) {
            button.textContent = `${browser.i18n.getMessage('content_liked')} ${liked}`
            button.classList.add('scsv-success')
          } else {
            button.textContent = browser.i18n.getMessage('content_like_all')
          }

          setTimeout(() => {
            button.classList.remove('scsv-success')
          }, 3000)
        } catch (error) {
          console.error('Error liking items:', error)
          button.textContent = browser.i18n.getMessage('content_error')
          button.classList.remove('scsv-loading')
          button.classList.add('scsv-error')
          
          setTimeout(() => {
            button.classList.remove('scsv-error')
            button.textContent = browser.i18n.getMessage('content_like_all')
          }, 3000)
        }
      } else {
        console.debug('No workshop items found')
      }
    }

    try {
      const user = await CollectionService.getCurrentUser()
      if (!user) return
      
      const storageKey = `likedItems_${user.steamId}_${this.id}`
      const result = await browser.storage.local.get(storageKey)
      const likedItems = Array.isArray(result[storageKey]) ? result[storageKey] : [];

      
      const allLiked = allItems.every(item => likedItems.includes(item))
      
      if (allLiked && allItems.length > 0) {
        button.textContent = browser.i18n.getMessage('content_all_liked')
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

      const children = collectionDetails[0].children
      if (!children || children.length === 0) {
        throw new Error('Collection appears empty via API (might be private)')
      }

      return children.map(item => item.publishedfileid)
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



  private displayItemSizes(itemSizes: ItemSize) {
    const addons = document.querySelectorAll('.collectionItem')
    
    addons.forEach((addon) => {
      const addonId = addon.id.replace('sharedfile_', '')
      const titleElement = addon.querySelector('.workshopItemTitle')
      
      if (titleElement && itemSizes[addonId] && itemSizes[addonId] !== 'N/A') {
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

  private async likeAllItems(workshopItemIds: string[], onProgress?: (current: number, total: number) => void): Promise<number> {
    const user = await CollectionService.getCurrentUser()
    if (!user) {
      alert(browser.i18n.getMessage('content_login_required_like'))
      return 0
    }

    const sessionId = user.sessionId
    const storageKey = `likedItems_${user.steamId}_${this.id}`
    const result = await browser.storage.local.get(storageKey)
  const likedItems = new Set<string>(Array.isArray(result[storageKey]) ? result[storageKey] : []);

    let successCount = 0
    let failureCount = 0
    let status15Timestamps: number[] = []
    let processedCount = 0

    for (const itemId of workshopItemIds) {
      if (onProgress) onProgress(processedCount, workshopItemIds.length)
      
      if (likedItems.has(itemId)) {
        processedCount++
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
            alert(browser.i18n.getMessage('content_many_private'))
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
      processedCount++
    }

    if (onProgress) onProgress(processedCount, workshopItemIds.length)

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