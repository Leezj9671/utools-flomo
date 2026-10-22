import './lib/devlog'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { isMock } from './lib/platform'
import './styles.css'

if (isMock) {
  document.documentElement.classList.add('mock')
  const q = new URLSearchParams(location.search)
  if (q.has('dark')) document.documentElement.dataset.theme = 'dark'
  if (q.has('light')) document.documentElement.dataset.theme = 'light'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
