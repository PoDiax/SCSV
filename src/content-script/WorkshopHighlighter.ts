import browser from 'webextension-polyfill'
import { SteamItemManager } from './SteamItemManager'
import { CollectionService } from '../shared/CollectionService'
import './styles.css'

export class WorkshopHighlighter {
  private cache: Record<string, string[]> = {}

  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        void this.init().catch(console.error)
      })
    } else {
      void this.init().catch(console.error)
    }
  }

  private async init() {
    const user = await CollectionService.getCurrentUser()
    if (!user) {
      console.log('SCSV: Not logged in, highlighting disabled.')
      return
    }

    const cacheKey = `scsv_collection_cache_${user.steamId}`
    const storage = await browser.storage.local.get(cacheKey)
    this.cache = (storage[cacheKey] || {}) as Record<string, any[]>

    this.highlightExistingItems()
    this.setupObserver()
  }

  private getAppId(): string | null {
    const urlParams = new URLSearchParams(window.location.search)
    let appId = urlParams.get('appid')
    if (appId) return appId
    
    const match = window.location.href.match(/\/app\/(\d+)/)
    if (match) return match[1]

    return null
  }

  private setupObserver() {
    let highlightTimeout: number | undefined;

    const observer = new MutationObserver((mutations) => {
      let shouldHighlight = false
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldHighlight = true
          break
        }
      }
      if (shouldHighlight) {
        if (highlightTimeout !== undefined) {
          window.clearTimeout(highlightTimeout);
        }
        highlightTimeout = window.setTimeout(() => {
          this.highlightExistingItems()
        }, 100);
      }
    })

    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true })
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true })
      })
    }
  }

  private highlightExistingItems() {
    const allLinks = document.querySelectorAll('a[href*="?id="]:not(.scsv-processed)')
    const links = Array.from(allLinks).filter(link => !link.closest('.scsv-collection-badge') && !link.closest('.scsv-modal'))
    
    links.forEach(link => {
      const href = link.getAttribute('href')
      if (!href || !href.includes('?id=')) return
      
      if (link.querySelector('img')) return
      
      const match = href.match(/\?id=(\d+)/)
      if (!match) return

      const itemId = match[1]
      const collections = this.cache[itemId]
      const appId = this.getAppId()

      link.classList.add('scsv-processed')

      const quickAddBtn = document.createElement('button')
      quickAddBtn.className = 'scsv-quick-add-btn'
      quickAddBtn.textContent = `+ ${browser.i18n.getMessage('content_add')}`
      quickAddBtn.title = browser.i18n.getMessage('content_add_to_collection')
      quickAddBtn.onclick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (appId) {
          const manager = new SteamItemManager(itemId, appId)
          manager.openCustomModal()
        } else {
          alert('Could not determine AppID to fetch collections.')
        }
      }

      if (collections && collections.length > 0) {
        const titleEl = link as HTMLElement
          
        titleEl.style.color = '#8bc53f'
        titleEl.style.textShadow = '0 0 5px rgba(139, 197, 63, 0.4)'
        titleEl.style.fontWeight = 'bold'
        
        const badge = document.createElement('div')
        badge.className = 'scsv-collection-badge'
        
        const strong = document.createElement('strong')
        strong.style.color = '#8bc53f'
        strong.textContent = browser.i18n.getMessage('content_in_collections')
        badge.appendChild(strong)
        badge.appendChild(document.createElement('br'))
        
        collections.forEach((c: any, index: number) => {
          if (typeof c === 'string') {
            badge.appendChild(document.createTextNode(c))
          } else {
            const a = document.createElement('a')
            a.href = `https://steamcommunity.com/sharedfiles/filedetails/?id=${c.id}`
            a.target = '_blank'
            a.className = 'scsv-collection-link scsv-processed'
            a.textContent = c.title
            badge.appendChild(a)
          }
          badge.appendChild(document.createElement('br'))
        })
        
        const actionsDiv = document.createElement('div')
        actionsDiv.style.marginTop = '4px'
        actionsDiv.appendChild(quickAddBtn)
        badge.appendChild(actionsDiv)
        
        if (link.parentElement) {
          link.parentElement.appendChild(badge)
        }
      } else {
        const actionsDiv = document.createElement('div')
        actionsDiv.style.marginTop = '4px'
        actionsDiv.appendChild(quickAddBtn)
        
        if (link.parentElement) {
          link.parentElement.appendChild(actionsDiv)
        }
      }
    })
  }
}

new WorkshopHighlighter()
