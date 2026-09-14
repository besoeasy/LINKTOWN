import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')

// Register Service Worker for PWA
const isProdBuild = (import.meta as any).env?.PROD ?? false
if ('serviceWorker' in navigator && isProdBuild) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA registration error:', err)
    })
  })
}
