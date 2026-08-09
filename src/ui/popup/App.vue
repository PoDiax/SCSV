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
            Steam Collection
          </h1>
          <p class="text-sm text-steam-blue">Size Viewer</p>
        </div>
      </div>

      <!-- Workshop link -->
      <div class="animate-slide-in">
        <a 
          href="https://steamcommunity.com/workshop/" 
          target="_blank"
          class="text-steam-light-green hover:text-steam-green transition-colors duration-300 text-lg font-semibold hover:underline"
        >
          Workshop
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
            <span>Syncing...</span>
          </span>
          <span v-else>Sync Collections Cache</span>
        </button>
        
        <!-- Progress Bar -->
        <div v-if="isSyncing" class="mt-2 text-center animate-fade-in">
          <div class="w-full bg-gray-700 rounded-full h-2.5 mt-1 overflow-hidden">
            <div class="bg-steam-light-green h-2.5 rounded-full transition-all duration-300" :style="{ width: `${syncProgress}%` }"></div>
          </div>
          <p class="text-xs text-steam-light-green mt-1">Please keep open. {{ syncCurrent }} / {{ syncTotal }} Collections</p>
        </div>

        <!-- Cache Stats -->
        <div v-if="cacheItemCount > 0 && !isSyncing" class="mt-2 text-center animate-fade-in flex flex-col items-center">
          <p class="text-xs text-steam-blue">Cached Items: <span class="text-steam-light-green font-semibold">{{ cacheItemCount }}</span> ({{ cacheSizeKB }} KB)</p>
          <button 
            @click="showDebug = !showDebug" 
            class="mt-1 text-[10px] text-steam-blue hover:text-steam-light-green underline"
          >
            {{ showDebug ? 'Hide' : 'View' }} Cache Data
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
          <span>Clearing...</span>
        </span>
        <span v-else>Clear Liked Addons</span>
      </button>

      <div v-if="statusMessage" class="animate-fade-in text-center">
        <p class="text-xs" :class="statusMessageClass">
          {{ statusMessage }}
        </p>
      </div>

      <div class="text-xs text-steam-light-blue text-center opacity-70">
        v{{ version }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import browser from 'webextension-polyfill'
import { version } from '~/package.json'
import { CollectionService } from '~/src/shared/CollectionService'

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
    showMessage('Error loading settings', 'error')
  }
}

const loadCacheStats = async () => {
  try {
    const storage = await browser.storage.local.get('scsv_collection_cache')
    const cache = storage.scsv_collection_cache || {}
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
    showMessage(`Unit changed to ${useGB.value ? 'GB' : 'MB'}`, 'success')
  } catch (error) {
    console.error('Error saving unit setting:', error)
    showMessage('Error saving settings', 'error')
  }
}

const clearLikedAddons = async () => {
  isClearing.value = true
  try {
    const allStorage = await browser.storage.local.get(null)
    const likedKeys = Object.keys(allStorage).filter(key => key.startsWith('likedItems_'))
    
    for (const key of likedKeys) {
      await browser.storage.local.remove(key)
    }
    
    showMessage('All liked addons cleared!', 'success')
  } catch (error) {
    console.error('Error clearing liked addons:', error)
    showMessage('Error clearing addons', 'error')
  } finally {
    isClearing.value = false
  }
}

const syncCollections = async () => {
  isSyncing.value = true
  syncProgress.value = 0
  syncCurrent.value = 0
  syncTotal.value = 0
  showMessage('Fetching collections list...', 'info')
  
  try {
    const collections = await CollectionService.getCollections()
    syncTotal.value = collections.length
    
    if (collections.length === 0) {
      showMessage('No collections found to sync.', 'info')
      isSyncing.value = false
      return
    }

    const storage = await browser.storage.local.get('scsv_collection_cache')
    const cache = (storage.scsv_collection_cache || {}) as Record<string, any[]>

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
    
    await browser.storage.local.set({ scsv_collection_cache: cache })
    await loadCacheStats()
    
    showMessage('Sync complete!', 'success')
  } catch (error) {
    console.error('Error syncing collections:', error)
    showMessage('Failed to fetch collections', 'error')
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