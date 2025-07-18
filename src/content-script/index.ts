import './styles.css'
// @ts-ignore: unused
import browser from 'webextension-polyfill' 
import { SteamCollectionAnalyzer } from './SteamCollectionAnalyzer'

// Create analyzer instance
const analyzer = new SteamCollectionAnalyzer()

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void analyzer.init().catch((err) => {
      console.error('Analyzer init error:', err)
    })
  })
} else {
  void analyzer.init().catch((err) => {
    console.error('Analyzer init error:', err)
  })
}

// Global error handler (content script context)
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
