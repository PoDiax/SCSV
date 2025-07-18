import browser from 'webextension-polyfill'

// Handle extension installation
browser.runtime.onInstalled.addListener((details) => {
  console.log('Steam Collection Size Viewer installed/updated:', details.reason)
  
  if (details.reason === 'install') {
    // Set default settings
    browser.storage.local.set({
      useGB: false,
    })
  }
})

// Handle extension startup
browser.runtime.onStartup.addListener(() => {
  console.log('Steam Collection Size Viewer started')
})

// Handle messages from content script or popup
// @ts-ignore
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message)
  
  // Handling for background operations will go here later on :)
  return false
})

// Handle errors gracefully
self.onerror = function (message, source, lineno, colno, error) {
  console.error('Background script error:', { message, source, lineno, colno, error })
}

console.log('Steam Collection Size Viewer background script loaded')

export {}