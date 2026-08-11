import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// Aplica el tema guardado antes del render para evitar un "flash" de color.
function applyInitialTheme() {
  const stored = localStorage.getItem('etf-theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const dark = stored ? stored === 'dark' : prefersDark
  const el = document.documentElement
  el.classList.toggle('dark', dark)
}

applyInitialTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)