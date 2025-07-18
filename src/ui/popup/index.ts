import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'

const app = createApp(App)
app.mount('#app')

// Handle errors gracefully
self.onerror = function (message, source, lineno, colno, error) {
  console.error('Extension error:', { message, source, lineno, colno, error })
}