// Fix for Vite HMR in service workers
// @ts-ignore
self.window = self;

import browser from 'webextension-polyfill'
import { CollectionService } from '../shared/CollectionService'

const SYNC_ALARM_NAME = 'scsv-auto-sync'

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  console.log('Steam Collection Size Viewer installed/updated:', details.reason)
  
  if (details.reason === 'install') {
    // Set default settings
    browser.storage.local.set({
      useGB: false,
    })
  }

  // Setup auto-sync alarm (every 30 minutes)
  browser.alarms.create(SYNC_ALARM_NAME, {
    periodInMinutes: 30,
  })
  
  void performSync()
})

// Handle extension startup
browser.runtime.onStartup.addListener(() => {
  console.log('Steam Collection Size Viewer started')
  void performSync()
})

// Handle messages from content script or popup
// @ts-ignore
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)
  return false
})

async function performSync() {
  console.log('Running background collection auto-sync...')
  try {
    const user = await CollectionService.getCurrentUser()
    if (!user) {
      console.log('Background sync skipped: User not logged in.')
      return
    }

    const collections = await CollectionService.getCollections()
    if (collections.length === 0) return

    const cacheKey = `scsv_collection_cache_${user.steamId}`
    const storage = await browser.storage.local.get(cacheKey)
    const cache = (storage[cacheKey] || {}) as Record<string, any[]>

    for (const collection of collections) {
      if (collection.children && Array.isArray(collection.children)) {
        collection.children.forEach(child => {
          const itemId = child.publishedfileid
          if (!itemId) return
          
          if (!cache[itemId]) cache[itemId] = []
          
          const stringIndex = cache[itemId].findIndex(c => typeof c === 'string' && c === collection.title)
          if (stringIndex !== -1) {
            cache[itemId].splice(stringIndex, 1)
          }
          
          const exists = cache[itemId].some(c => typeof c !== 'string' && c.id === collection.publishedfileid)
          if (!exists) {
            cache[itemId].push({ id: collection.publishedfileid, title: collection.title })
          }
        })
      }
    }
    
    await browser.storage.local.set({ [cacheKey]: cache })
    console.log(`Background sync completed for user ${user.steamId}.`)
  } catch (error) {
    console.error('Background auto-sync failed:', error)
  }
}

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === SYNC_ALARM_NAME) {
    void performSync()
  }
})

// Handle errors gracefully
self.onerror = function (message, source, lineno, colno, error) {
  console.error('Background script error:', { message, source, lineno, colno, error })
}

console.log('Steam Collection Size Viewer background script loaded')

export {}