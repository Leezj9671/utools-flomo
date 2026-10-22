import './lib/devlog'
import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { isMock } from './lib/platform'
import './styles.css'

const root = createRoot(document.getElementById('root')!)
const render = (node: ReactNode) =>
  root.render(
    <StrictMode>
      <ErrorBoundary>{node}</ErrorBoundary>
    </StrictMode>,
  )

if (import.meta.env.DEV && isMock) {
  import('./dev/MockFrame').then(({ MockFrame }) =>
    render(
      <MockFrame>
        <App />
      </MockFrame>,
    ),
  )
} else {
  render(<App />)
}
