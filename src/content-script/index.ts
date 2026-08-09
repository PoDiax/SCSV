import './styles.css'
// @ts-ignore: unused
import browser from 'webextension-polyfill' 
import { SteamCollectionAnalyzer } from './SteamCollectionAnalyzer'
import { SteamItemManager } from './SteamItemManager'

const analyzer = new SteamCollectionAnalyzer()
const itemManager = new SteamItemManager()

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void analyzer.init().catch(console.error)
    void itemManager.init().catch(console.error)
  })
} else {
  void analyzer.init().catch(console.error)
  void itemManager.init().catch(console.error)
}

window.onerror = (
  message: string | Event,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): void => {
  console.error('Content script error:', { message, source, lineno, colno, error })
}

console.info('Steam Collection Size Viewer content script loaded')
