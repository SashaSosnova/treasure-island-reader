import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { hydrateStorage } from './utils/storage'

async function boot() {
  try {
    await hydrateStorage()
  } catch (error) {
    console.warn('hydrateStorage failed', error)
  }
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

boot()
