<template>
  <div class="popup-container bg-steam-dark text-steam-green min-w-[200px] max-w-[400px] w-full">
    <div class="flex flex-col items-center justify-center p-4 space-y-4">
      <!-- Logo with animation -->
      <div class="flex items-center space-x-3 animate-fade-in">
        <img 
          src="/icon.png" 
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

      <!-- Clear button -->
      <button 
        @click="clearLikedAddons"
        :disabled="isClearing"
        class="steam-button px-4 py-2 bg-steam-light-green text-steam-dark rounded-lg font-semibold text-sm hover:bg-steam-green hover:text-white disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
      >
        <span v-if="isClearing" class="flex items-center space-x-2">
          <div class="loading-spinner w-4 h-4"></div>
          <span>Clearing...</span>
        </span>
        <span v-else>Clear Liked Addons</span>
      </button>

      <!-- Status message -->
      <div v-if="statusMessage" class="animate-fade-in text-center">
        <p class="text-xs" :class="statusMessageClass">
          {{ statusMessage }}
        </p>
      </div>

      <!-- Version info -->
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

const useGB = ref(false)
const isClearing = ref(false)
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

onMounted(() => {
  loadSettings()
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