<template>
  <div class="popup-container bg-steam-dark text-steam-green min-w-[200px] max-w-[400px] w-full">
    <div class="flex flex-col items-center justify-center p-4 space-y-4">
      <!-- Logo with animation -->
      <div class="flex items-center space-x-3 animate-fade-in">
        <img 
          src="../../../icon.png" 
          alt="Steam Collection Size Viewer" 
          class="w-12 h-12 rounded-lg hover:scale-110 transition-transform duration-300"
        >
        <div class="text-center">
          <h1 class="text-lg font-bold text-steam-light-green">
            {{ t('popup_title') }}
          </h1>
          <p class="text-sm text-steam-blue">{{ t('popup_subtitle') }}</p>
        </div>
      </div>

      <!-- Workshop link -->
      <div class="animate-slide-in">
        <a 
          href="https://steamcommunity.com/workshop/" 
          target="_blank"
          class="text-steam-light-green hover:text-steam-green transition-colors duration-300 text-lg font-semibold hover:underline"
        >
          {{ t('popup_workshop_link') }}
        </a>
      </div>

      <!-- Unit toggle -->
      <div class="toggle-container animate-slide-in flex items-center space-x-3 p-2 rounded-lg bg-steam-dark bg-opacity-50">
        <span class="text-sm text-steam-blue">MB</span>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            v-model="useGB" 
            @change="onUnitToggle"
            class="sr-only"
          >
          <div class="toggle-background w-14 h-7 bg-gray-600 rounded-full p-1 transition-all duration-300"
              :class="{ 'bg-steam-green': useGB }">
            <div class="toggle-dot w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300"
                :class="{ 'translate-x-7': useGB }">
            </div>
          </div>
        </label>
        <span class="text-sm text-steam-blue">GB</span>
      </div>

      <!-- Sync Collections Button -->
      <div class="w-full">
        <button 
          @click="syncCollections"
          :disabled="isSyncing"
          class="steam-button w-full px-4 py-2 bg-[#2a475e] text-[#66c0f4] border border-[#66c0f4] rounded-lg font-semibold text-sm hover:bg-[#66c0f4] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
        >
          <span v-if="isSyncing" class="flex items-center justify-center space-x-2">
            <div class="loading-spinner w-4 h-4"></div>
            <span>{{ t('popup_syncing') }}</span>
          </span>
          <span v-else>{{ t('popup_sync_btn') }}</span>
        </button>
        
        <!-- Progress Bar -->
        <div v-if="isSyncing" class="mt-2 text-center animate-fade-in">
          <div class="w-full bg-gray-700 rounded-full h-2.5 mt-1 overflow-hidden">
            <div class="bg-steam-light-green h-2.5 rounded-full transition-all duration-300" :style="{ width: `${syncProgress}%` }"></div>
          </div>
          <p class="text-xs text-steam-light-green mt-1">{{ t('popup_sync_progress') }} {{ syncCurrent }} / {{ syncTotal }} {{ t('popup_collections_text') }}</p>
        </div>

        <!-- Cache Stats -->
        <div v-if="cacheItemCount > 0 && !isSyncing" class="mt-2 text-center animate-fade-in flex flex-col items-center">
          <p class="text-xs text-steam-blue">{{ t('popup_cache_items') }} <span class="text-steam-light-green font-semibold">{{ cacheItemCount }}</span> ({{ cacheSizeKB }} KB)</p>
          <button 
            @click="showDebug = !showDebug" 
            class="mt-1 text-[10px] text-steam-blue hover:text-steam-light-green underline"
          >
            {{ showDebug ? t('popup_hide_cache') : t('popup_view_cache') }}
          </button>
        </div>
        
        <!-- Debug Cache View -->
        <div v-if="showDebug" class="mt-2 w-full animate-fade-in">
          <textarea 
            readonly 
            class="w-full h-32 text-xs bg-gray-800 text-steam-light-green p-2 rounded custom-scrollbar border border-gray-600 focus:outline-none"
            :value="debugCacheContent"
          ></textarea>
        </div>
      </div>

      <button 
        @click="clearLikedAddons"
        :disabled="isClearing"
        class="steam-button px-4 py-2 bg-steam-light-green text-steam-dark rounded-lg font-semibold text-sm hover:bg-steam-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] w-full"
      >
        <span v-if="isClearing" class="flex items-center justify-center space-x-2">
          <div class="loading-spinner w-4 h-4"></div>
          <span>{{ t('popup_clearing') }}</span>
        </span>
        <span v-else>{{ t('popup_clear_btn') }}</span>
      </button>

      <div v-if="statusMessage" class="animate-fade-in text-center">
        <p class="text-xs" :class="statusMessageClass">
          {{ statusMessage }}
        </p>
      </div>

      <div class="text-xs text-center opacity-70">
        <a 
          href="https://github.com/PoDiax/SCSV" 
          target="_blank" 
          class="text-steam-light-blue hover:text-steam-light-green transition-colors hover:underline"
          title="View Source on GitHub / Report Issues"
        >
          v{{ version }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import browser from 'webextension-polyfill'
import { version } from '~/package.json'
import { CollectionService } from '~/src/shared/CollectionService'

const t = (key: string, substitutions?: string | string[]) => {
  return browser.i18n.getMessage(key, substitutions) || key
}

const useGB = ref(false)
const isClearing = ref(false)
const isSyncing = ref(false)
const syncProgress = ref(0)
const syncCurrent = ref(0)
const syncTotal = ref(0)
const cacheItemCount = ref(0)
const cacheSizeKB = ref(0)
const showDebug = ref(false)
const debugCacheContent = ref('')
const statusMessage = ref('')
const statusType = ref<'success' | 'error' | 'info'>('info')

const statusMessageClass = computed(() => {
  switch (statusType.value) {
    case 'success':
      return 'text-steam-light-green'
    case 'error':
      return 'text-red-400'
    default:
      return 'text-steam-blue'
  }
})

const currentSteamId = ref<string | null>(null)

const showMessage = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  statusMessage.value = message
  statusType.value = type
  setTimeout(() => {
    statusMessage.value = ''
  }, 3000)
}

const loadSettings = async () => {
  try {
    const result = await browser.storage.local.get('useGB')
    useGB.value = typeof result.useGB === 'boolean' ? result.useGB : false
  } catch (error) {
    console.error('Error loading settings:', error)
    showMessage(t('msg_error_saving'), 'error')
  }
}

const loadCacheStats = async () => {
  try {
    const user = await CollectionService.getCurrentUser()
    if (!user) {
      cacheItemCount.value = 0
      debugCacheContent.value = t('msg_not_logged_in')
      return
    }
    
    currentSteamId.value = user.steamId
    const cacheKey = `scsv_collection_cache_${user.steamId}`
    const storage = await browser.storage.local.get(cacheKey)
    const cache = storage[cacheKey] || {}
    const keys = Object.keys(cache)
    cacheItemCount.value = keys.length
    
    const sizeBytes = new Blob([JSON.stringify(cache)]).size
    cacheSizeKB.value = Math.round(sizeBytes / 1024)
    
    debugCacheContent.value = JSON.stringify(cache, null, 2)
  } catch (error) {
    console.error('Failed to load cache stats:', error)
  }
}

const onUnitToggle = async () => {
  try {
    await browser.storage.local.set({ useGB: useGB.value })
    showMessage(`${t('msg_unit_changed')} ${useGB.value ? 'GB' : 'MB'}`, 'success')
  } catch (error) {
    console.error('Error saving unit setting:', error)
    showMessage(t('msg_error_saving'), 'error')
  }
}

const clearLikedAddons = async () => {
  isClearing.value = true
  try {
    if (!currentSteamId.value) {
      showMessage(t('msg_not_logged_in'), 'error')
      return
    }
    const allStorage = await browser.storage.local.get(null)
    const prefix = `likedItems_${currentSteamId.value}_`
    const likedKeys = Object.keys(allStorage).filter(key => key.startsWith(prefix))
    
    for (const key of likedKeys) {
      await browser.storage.local.remove(key)
    }
    
    showMessage(t('msg_liked_cleared'), 'success')
  } catch (error) {
    console.error('Error clearing liked addons:', error)
    showMessage(t('msg_error_clearing'), 'error')
  } finally {
    isClearing.value = false
  }
}

const syncCollections = async () => {
  isSyncing.value = true
  syncProgress.value = 0
  syncCurrent.value = 0
  syncTotal.value = 0
  showMessage(t('msg_fetching_list'), 'info')
  
  try {
    const user = await CollectionService.getCurrentUser()
    if (!user) {
      showMessage(t('msg_not_logged_in'), 'error')
      isSyncing.value = false
      return
    }
    currentSteamId.value = user.steamId

    const collections = await CollectionService.getCollections()
    syncTotal.value = collections.length
    
    if (collections.length === 0) {
      showMessage(t('msg_no_collections'), 'info')
      isSyncing.value = false
      return
    }

    const cacheKey = `scsv_collection_cache_${user.steamId}`
    const storage = await browser.storage.local.get(cacheKey)
    const cache = (storage[cacheKey] || {}) as Record<string, any[]>

    for (const collection of collections) {
      syncCurrent.value++
      syncProgress.value = Math.round((syncCurrent.value / syncTotal.value) * 100)
      
      try {
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
      } catch (err) {
        console.error(`Error syncing collection ${collection.title}:`, err)
      }
    }
    
    const cacheKeyToSave = `scsv_collection_cache_${currentSteamId.value}`
    await browser.storage.local.set({ [cacheKeyToSave]: cache })
    await loadCacheStats()
    
    showMessage(t('msg_sync_complete'), 'success')
  } catch (error) {
    console.error('Error syncing collections:', error)
    showMessage(t('msg_sync_failed'), 'error')
  } finally {
    isSyncing.value = false
  }
}

onMounted(() => {
  loadSettings()
  loadCacheStats()
})
</script>

<style scoped>
.popup-container {
  min-height: 240px;
  max-height: 600px;
}

.toggle-background {
  transition: background-color 0.3s ease;
}

.toggle-dot {
  transition: transform 0.3s ease;
}

@media (max-width: 320px) {
  .popup-container {
    min-width: 280px;
  }
}
</style>