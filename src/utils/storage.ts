import browser from 'webextension-polyfill'
import type { ExtensionStorage } from '@/types'

export class StorageManager {
  static async get<K extends keyof ExtensionStorage>(
    key: K
  ): Promise<ExtensionStorage[K] | undefined> {
    try {
      const result = await browser.storage.local.get(key)
      return result[key] as ExtensionStorage[K] | undefined
    } catch (error) {
      console.error('Error getting storage:', error)
      return undefined
    }
  }


  static async set<K extends keyof ExtensionStorage>(
    key: K,
    value: ExtensionStorage[K]
  ): Promise<void> {
    try {
      await browser.storage.local.set({ [key]: value })
    } catch (error) {
      console.error('Error setting storage:', error)
      throw error
    }
  }

  static async remove(key: keyof ExtensionStorage): Promise<void> {
    try {
      await browser.storage.local.remove(key)
    } catch (error) {
      console.error('Error removing from storage:', error)
      throw error
    }
  }

  static async clear(): Promise<void> {
    try {
      await browser.storage.local.clear()
    } catch (error) {
      console.error('Error clearing storage:', error)
      throw error
    }
  }

  static async getAllLikedItems(): Promise<string[]> {
    try {
      const allStorage = await browser.storage.local.get(null)
      return Object.keys(allStorage).filter(key => key.startsWith('likedItems_'))
    } catch (error) {
      console.error('Error getting liked items:', error)
      return []
    }
  }

  static async clearAllLikedItems(): Promise<void> {
    try {
      const likedKeys = await this.getAllLikedItems()
      for (const key of likedKeys) {
        await this.remove(key as keyof ExtensionStorage)
      }
    } catch (error) {
      console.error('Error clearing liked items:', error)
      throw error
    }
  }
}