import browser from 'webextension-polyfill'
import { CollectionService } from '../shared/CollectionService'

export class SteamItemManager {
  private id: string | null = null
  private appId: string | null = null

  constructor(id?: string, appId?: string) {
    if (id) {
      this.id = id
    } else {
      const currentUrl = new URL(window.location.href)
      this.id = currentUrl.searchParams.get('id')
    }
    
    if (appId) {
      this.appId = appId
    }
  }

  async init() {
    if (!this.id) return

    const originalBtn = document.getElementById('AddToCollectionBtn')
    if (!originalBtn) return

    const appidInput = document.querySelector('input[name="appid"]') as HTMLInputElement
    if (appidInput) {
      this.appId = appidInput.value
    } else {
      const appLink = document.querySelector('.breadcrumbs a[href*="/app/"]')
      if (appLink) {
        const match = appLink.getAttribute('href')?.match(/\/app\/(\d+)/)
        if (match) this.appId = match[1]
      }
    }

    if (!this.appId) {
      console.warn('Could not determine AppID for item')
      return
    }

    this.injectCustomButton(originalBtn as HTMLElement)
  }

  private injectCustomButton(originalBtn: HTMLElement) {
    const newBtn = document.createElement(originalBtn.tagName)
    newBtn.className = originalBtn.className
    Array.from(originalBtn.childNodes).forEach(child => newBtn.appendChild(child.cloneNode(true)))
    
    newBtn.id = 'SCSV_AddToCollectionBtn'
    
    newBtn.classList.add('scsv-custom-add-btn')
    
    if (newBtn.tagName.toLowerCase() === 'a') {
      newBtn.removeAttribute('href')
    }

    newBtn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      e.stopImmediatePropagation()
      this.openCustomModal()
    })

    originalBtn.parentNode?.replaceChild(newBtn, originalBtn)
  }

  private async updateCache(itemId: string, collectionId: string, collectionTitle: string, action: 'add' | 'remove') {
    const user = await CollectionService.getCurrentUser()
    if (!user) return

    const cacheKey = `scsv_collection_cache_${user.steamId}`
    const storage = await browser.storage.local.get(cacheKey)
    const cache = (storage[cacheKey] || {}) as Record<string, any[]>
    
    if (!cache[itemId]) {
      cache[itemId] = []
    }
    
    if (action === 'add') {
      const stringIndex = cache[itemId].findIndex(c => typeof c === 'string' && c === collectionTitle)
      if (stringIndex !== -1) {
        cache[itemId].splice(stringIndex, 1)
      }
      
      const exists = cache[itemId].some(c => typeof c !== 'string' && c.id === collectionId)
      if (!exists) {
        cache[itemId].push({ id: collectionId, title: collectionTitle })
      }
    } else {
      cache[itemId] = cache[itemId].filter(c => typeof c === 'string' ? c !== collectionTitle : c.id !== collectionId)
      if (cache[itemId].length === 0) {
        delete cache[itemId]
      }
    }
    
    await browser.storage.local.set({ [cacheKey]: cache })
  }

  private getRequiredItems(): { id: string, name: string }[] {
    const reqItemsContainer = document.querySelector('#RequiredItems, .requiredItemsContainer')
    if (!reqItemsContainer) return []

    const links = Array.from(reqItemsContainer.querySelectorAll('a[href*="?id="]'))
    const items = links.map(a => {
      const match = (a as HTMLAnchorElement).href.match(/\?id=(\d+)/)
      if (!match) return null
      
      const id = match[1]
      const requiredItemDiv = a.querySelector('.requiredItem')
      const name = requiredItemDiv ? requiredItemDiv.textContent?.trim() : a.textContent?.trim()
      
      return { id, name: name || `Item ${id}` }
    }).filter(Boolean) as { id: string, name: string }[]
    
    const unique = new Map()
    for (const item of items) {
      if (!unique.has(item.id)) unique.set(item.id, item)
    }
    return Array.from(unique.values())
  }

  private promptRequiredItems(items: { id: string, name: string }[]): Promise<string[] | null> {
    return new Promise((resolve) => {
      const nestedBackdrop = document.createElement('div')
      nestedBackdrop.className = 'scsv-modal-backdrop scsv-nested-backdrop'
      
      const modal = document.createElement('div')
      modal.className = 'scsv-nested-modal'
      
      const header = document.createElement('div')
      header.className = 'scsv-nested-header'
      const title = document.createElement('h3')
      title.textContent = browser.i18n.getMessage('content_req_items_title')
      const closeBtn = document.createElement('button')
      closeBtn.className = 'scsv-nested-close'
      closeBtn.innerHTML = '&times;'
      header.appendChild(title)
      header.appendChild(closeBtn)
      
      const content = document.createElement('div')
      content.className = 'scsv-nested-content custom-scrollbar'
      
      items.forEach(item => {
        const label = document.createElement('label')
        label.className = 'scsv-nested-row'
        
        const cb = document.createElement('input')
        cb.type = 'checkbox'
        cb.value = item.id
        cb.checked = true
        cb.className = 'scsv-req-checkbox'
        
        const span = document.createElement('span')
        span.className = 'scsv-req-name'
        span.textContent = item.name
        
        label.appendChild(cb)
        label.appendChild(span)
        content.appendChild(label)
      })
      
      const actions = document.createElement('div')
      actions.className = 'scsv-nested-actions'
      
      const skipBtn = document.createElement('button')
      skipBtn.className = 'scsv-btn-skip'
      skipBtn.textContent = browser.i18n.getMessage('content_skip')
      
      const addBtn = document.createElement('button')
      addBtn.className = 'scsv-btn-add scsv-active'
      addBtn.textContent = browser.i18n.getMessage('content_add_selected')
      
      actions.appendChild(skipBtn)
      actions.appendChild(addBtn)
      
      modal.appendChild(header)
      modal.appendChild(content)
      modal.appendChild(actions)
      nestedBackdrop.appendChild(modal)
      document.body.appendChild(nestedBackdrop)
      
      const close = (result: string[] | null) => {
        nestedBackdrop.remove()
        resolve(result)
      }
      
      modal.querySelector('.scsv-nested-close')?.addEventListener('click', () => close(null))
      nestedBackdrop.addEventListener('click', (e) => {
        if (e.target === nestedBackdrop) close(null)
      })
      
      modal.querySelector('.scsv-btn-skip')?.addEventListener('click', () => close([]))
      modal.querySelector('.scsv-btn-add')?.addEventListener('click', () => {
        const checkboxes = modal.querySelectorAll('.scsv-req-checkbox:checked')
        const selectedIds = Array.from(checkboxes).map(cb => (cb as HTMLInputElement).value)
        close(selectedIds)
      })
    })
  }

  public async openCustomModal() {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const backdrop = document.createElement('div')
    backdrop.className = 'scsv-modal-backdrop'
    
    const modal = document.createElement('div')
    modal.className = 'scsv-modal'
    
    const header = document.createElement('div')
    header.className = 'scsv-modal-header'
    const logoBase64 = "data:image/png;base64,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"
    const headerContainer = document.createElement('div')
    headerContainer.className = 'scsv-header-title-container'
    
    const logoImg = document.createElement('img')
    logoImg.src = logoBase64
    logoImg.className = 'scsv-header-logo'
    logoImg.alt = 'SCSV'
    
    const h2 = document.createElement('h2')
    h2.textContent = browser.i18n.getMessage('content_add_to_collection')
    
    headerContainer.appendChild(logoImg)
    headerContainer.appendChild(h2)
    
    const modalCloseBtn = document.createElement('button')
    modalCloseBtn.className = 'scsv-modal-close'
    modalCloseBtn.innerHTML = '&times;'
    
    const addCollectionBtn = document.createElement('a')
    addCollectionBtn.className = 'scsv-modal-add-btn'
    addCollectionBtn.href = `https://steamcommunity.com/workshop/editcollection/?appid=${this.appId}`
    addCollectionBtn.target = '_blank'
    addCollectionBtn.innerHTML = '+'
    addCollectionBtn.title = browser.i18n.getMessage('content_create_new')
    
    const headerActions = document.createElement('div')
    headerActions.style.display = 'flex'
    headerActions.style.alignItems = 'center'
    headerActions.style.gap = '12px'

    headerActions.appendChild(addCollectionBtn)
    headerActions.appendChild(modalCloseBtn)
    
    header.appendChild(headerContainer)
    header.appendChild(headerActions)
    modal.appendChild(header)

    const requiredItems = this.getRequiredItems()
    
    const content = document.createElement('div')
    content.className = 'scsv-modal-content custom-scrollbar'
    const spinnerContainer = document.createElement('div')
    spinnerContainer.className = 'scsv-loading-spinner'
    
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(`<svg class="animate-spin" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`, 'image/svg+xml')
    spinnerContainer.appendChild(svgDoc.documentElement)
    
    const spinnerText = document.createElement('span')
    spinnerText.textContent = browser.i18n.getMessage('content_loading_collections')
    spinnerContainer.appendChild(spinnerText)
    
    content.appendChild(spinnerContainer)
    
    modal.appendChild(header)
    modal.appendChild(content)
    backdrop.appendChild(modal)
    document.body.appendChild(backdrop)

    const closeModal = () => {
      backdrop.remove()
      document.body.style.overflow = originalOverflow
    }
    header.querySelector('.scsv-modal-close')?.addEventListener('click', closeModal)
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal()
    })

    try {
      const collections = await CollectionService.getCollections(this.appId!)
      
      if (collections.length === 0) {
        const appHubName = document.querySelector('.apphub_AppName')?.textContent?.trim() || 'this game'
        
        const emptyDiv = document.createElement('div')
        emptyDiv.className = 'scsv-empty'
        emptyDiv.style.padding = '20px'
        emptyDiv.style.textAlign = 'center'
        emptyDiv.style.color = '#8f98a0'
        
        const textNode1 = document.createTextNode(browser.i18n.getMessage('content_no_collections_link_1') + appHubName + browser.i18n.getMessage('content_no_collections_link_2'))
        
        const link = document.createElement('a')
        link.href = `https://steamcommunity.com/workshop/editcollection/?appid=${this.appId}`
        link.target = '_blank'
        link.textContent = browser.i18n.getMessage('content_no_collections_link_3')
        link.style.color = '#66c0f4'
        link.style.textDecoration = 'underline'
        
        const textNode2 = document.createTextNode(browser.i18n.getMessage('content_no_collections_link_4'))
        
        emptyDiv.appendChild(textNode1)
        emptyDiv.appendChild(link)
        emptyDiv.appendChild(textNode2)
        
        content.textContent = ''
        content.appendChild(emptyDiv)
        return
      }

      content.textContent = ''
      collections.forEach(collection => {
        const isAlreadyIn = collection.children?.some(c => c.publishedfileid === this.id)

        const row = document.createElement('div')
        row.className = 'scsv-collection-row'
        
          const infoDiv = document.createElement('div')
          infoDiv.className = 'scsv-collection-info'
          
          const titleLink = document.createElement('a')
          titleLink.href = `https://steamcommunity.com/sharedfiles/filedetails/?id=${collection.publishedfileid}`
          titleLink.target = '_blank'
          titleLink.className = 'scsv-collection-title scsv-processed'
          titleLink.textContent = collection.title
          
          const countSpan = document.createElement('span')
          countSpan.className = 'scsv-collection-count'
          countSpan.textContent = `${collection.num_children} ${browser.i18n.getMessage('content_items')}`
          
          infoDiv.appendChild(titleLink)
          infoDiv.appendChild(countSpan)
          
          const actionBtn = document.createElement('button')
          actionBtn.className = `scsv-toggle-btn ${isAlreadyIn ? 'scsv-active' : ''}`
          actionBtn.textContent = isAlreadyIn ? browser.i18n.getMessage('content_added') : browser.i18n.getMessage('content_add')
          
          row.appendChild(infoDiv)
          row.appendChild(actionBtn)

        const btn = row.querySelector('.scsv-toggle-btn') as HTMLButtonElement
        if (!btn) return
        btn.addEventListener('click', async () => {
          if (btn.disabled) return
          btn.disabled = true
          
          const action = btn.classList.contains('scsv-active') ? 'remove' : 'add'
          let selectedReqIds: string[] = []

          if (action === 'add' && requiredItems.length > 0) {
            const result = await this.promptRequiredItems(requiredItems)
            if (result === null) {
              btn.disabled = false
              return
            }
            selectedReqIds = result
          }

          btn.textContent = ''
          const svgParser = new DOMParser()
          const loadingSvg = svgParser.parseFromString(`<svg class="animate-spin" viewBox="0 0 24 24" width="16" height="16"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`, 'image/svg+xml')
          btn.appendChild(loadingSvg.documentElement)
          
          try {
            const success = await CollectionService.toggleItemInCollection(
              collection.publishedfileid, 
              collection.title, 
              this.id!, 
              action
            )
            
            if (success) {
              if (action === 'add') {
                btn.classList.add('scsv-active')
                btn.textContent = browser.i18n.getMessage('content_added')
                collection.num_children++
                this.updateCache(this.id!, collection.publishedfileid, collection.title, 'add')
                
                if (selectedReqIds.length > 0) {
                  (async () => {
                    let addedCount = 0
                    for (const reqId of selectedReqIds) {
                      addedCount++
                      btn.textContent = `${browser.i18n.getMessage('content_adding')} ${addedCount}/${selectedReqIds.length}...`
                      try {
                        await CollectionService.toggleItemInCollection(
                          collection.publishedfileid,
                          collection.title,
                          reqId,
                          'add'
                        )
                        this.updateCache(reqId, collection.publishedfileid, collection.title, 'add')
                        await new Promise(resolve => setTimeout(resolve, 500))
                      } catch (e) {
                        console.error('Error adding required item:', reqId, e)
                      }
                    }
                    btn.textContent = browser.i18n.getMessage('content_added_all')
                    setTimeout(() => {
                      if (btn.classList.contains('scsv-active')) {
                        btn.textContent = browser.i18n.getMessage('content_added')
                      }
                    }, 2000)
                  })()
                }
              } else {
                btn.classList.remove('scsv-active')
                btn.textContent = browser.i18n.getMessage('content_add')
                collection.num_children--
                this.updateCache(this.id!, collection.publishedfileid, collection.title, 'remove')
              }
              row.querySelector('.scsv-collection-count')!.textContent = `${collection.num_children} ${browser.i18n.getMessage('content_items')}`
            } else {
              btn.textContent = browser.i18n.getMessage('content_error')
            }
          } catch (e) {
            console.error('Failed to toggle:', e)
            btn.textContent = browser.i18n.getMessage('content_error')
          } finally {
            btn.disabled = false
          }
        })

        content.appendChild(row)
      })

    } catch (error) {
      console.error('Failed to load collections:', error)
      const errorDiv = document.createElement('div')
      errorDiv.className = 'scsv-error'
      errorDiv.textContent = 'Failed to load collections. Please make sure you are logged in.'
      content.textContent = ''
      content.appendChild(errorDiv)
    }
  }
}
