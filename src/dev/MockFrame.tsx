// Dev only: a uTools-like window around the app for browser previews, and a captioned
// "stage" layout used by scripts/store-shots.mjs for plugin-market screenshots.
// Loaded through a dynamic import guarded by import.meta.env.DEV, so it never ships.
import type { ReactNode } from 'react'
import { Mark } from '../components/Icons'
import './mock-frame.css'

const q = new URLSearchParams(location.search)
document.documentElement.classList.add('mock')
if (q.has('dark')) document.documentElement.dataset.theme = 'dark'
if (q.has('light')) document.documentElement.dataset.theme = 'light'

export function MockFrame({ children }: { children: ReactNode }) {
  const stage = q.has('stage')
  const title = q.get('title')
  const sub = q.get('sub')
  return (
    <div className={'mf' + (stage ? ' mf-stage' : '')}>
      {stage && title && (
        <header className="mf-caption">
          <h1>{title}</h1>
          {sub && <p>{sub}</p>}
        </header>
      )}
      <div className="mf-window">
        <div className="mf-bar">
          <span className="mf-pill">
            <Mark size={18} />
            flomo 速记
          </span>
          <Mark size={34} />
        </div>
        <div className="mf-body">{children}</div>
      </div>
    </div>
  )
}
