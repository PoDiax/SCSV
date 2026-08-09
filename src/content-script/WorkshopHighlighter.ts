import browser from 'webextension-polyfill'
import { SteamItemManager } from './SteamItemManager'
import './styles.css'

export class WorkshopHighlighter {
  private cache: Record<string, string[]> = {}

  constructor() {
    this.init()
  }

  private async init() {
    const storage = await browser.storage.local.get('scsv_collection_cache')
    this.cache = (storage.scsv_collection_cache || {}) as Record<string, any[]>

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
    const observer = new MutationObserver((mutations) => {
      let shouldHighlight = false
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldHighlight = true
          break
        }
      }
      if (shouldHighlight) {
        this.highlightExistingItems()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
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
      quickAddBtn.textContent = '+ Add'
      quickAddBtn.title = 'Add to Collection'
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
        
        const linksHtml = collections.map((c: any) => {
          if (typeof c === 'string') return c
          return `<a href="https://steamcommunity.com/sharedfiles/filedetails/?id=${c.id}" target="_blank" class="scsv-collection-link scsv-processed">${c.title}</a>`
        }).join('<br>')
        
        const badge = document.createElement('div')
        badge.className = 'scsv-collection-badge'
        badge.innerHTML = `<strong style="color: #8bc53f;">In Collections:</strong><br>${linksHtml}`
        
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
