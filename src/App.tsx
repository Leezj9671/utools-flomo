import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Composer, type Seed } from './components/Composer'
import { Onboarding } from './components/Onboarding'
import { SettingsView } from './components/SettingsView'
import { services, setPanelHeight, utools } from './lib/platform'
import {
  clearDraft,
  loadApi,
  loadDraft,
  loadRecentTags,
  loadSettings,
  saveApi,
  saveDraft,
  saveSettings,
  type Settings,
} from './lib/store'

type View = 'compose' | 'settings' | 'onboarding'

const MIN_HEIGHT = 220
const MAX_HEIGHT = 600

let seedId = 0

function seedFor(text: string, settings: Settings, sourceHint: Promise<string> = Promise.resolve('')): Seed {
  const tags = [...settings.defaultTags]
  if (text) return { id: ++seedId, text, quote: '', source: '', tags, sourceHint }
  const draft = loadDraft()
  if (draft) {
    // Default tags added since the draft was written should still show up.
    const merged = [...draft.tags, ...tags.filter((t) => !draft.tags.includes(t))]
    return { id: ++seedId, ...draft, tags: merged, sourceHint }
  }
  return { id: ++seedId, text: '', quote: '', source: '', tags, sourceHint }
}

export function App() {
  const [settings, setSettings] = useState(loadSettings)
  const [api, setApi] = useState(() => loadApi(loadSettings()))
  const [recentTags, setRecentTags] = useState(loadRecentTags)
  const [view, setView] = useState<View>(api ? 'compose' : 'onboarding')
  const [seed, setSeed] = useState<Seed>(() => seedFor('', settings))
  const [candidate, setCandidate] = useState('')
  const [hasPending, setHasPending] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Refs let the once-registered uTools listeners see current state.
  const stateRef = useRef({ settings, api })
  stateRef.current = { settings, api }

  useEffect(() => {
    utools.onPluginEnter(({ code, payload }) => {
      const { settings, api } = stateRef.current
      const text = typeof payload === 'string' && code !== 'setup' ? payload : ''
      setRecentTags(loadRecentTags())
      // Read the browser URL right away: it only works while the browser is still the
      // active window, which may no longer be true once the user toggles 摘录.
      const sourceHint = text && settings.withSource ? services.currentBrowserUrl() : Promise.resolve('')

      if (code === 'setup') {
        setCandidate(typeof payload === 'string' ? (services.parseApiUrl(payload) ?? '') : '')
        setView(api ? 'settings' : 'onboarding')
        return
      }
      const next = seedFor(text, settings, sourceHint)
      setSeed(next)
      if (api) {
        setView('compose')
      } else {
        // Hold on to what the user brought in; it comes back once connected.
        saveDraft(next)
        setHasPending(Boolean(next.text || next.quote))
        setCandidate('')
        setView('onboarding')
      }
    })
    utools.onDbPull(() => {
      const s = loadSettings()
      setSettings(s)
      setRecentTags(loadRecentTags())
      if (s.syncApi) setApi(loadApi(s))
    })
  }, [])

  // Fit the uTools panel to the content.
  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return
    const fit = () => setPanelHeight(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(el.scrollHeight))))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [view])

  const updateSettings = useCallback(
    (next: Settings) => {
      setSettings(next)
      saveSettings(next)
      if (next.syncApi !== settings.syncApi) saveApi(api, next)
    },
    [api, settings.syncApi],
  )

  const connect = (url: string) => {
    saveApi(url, settings)
    setApi(url)
    setCandidate('')
    setHasPending(false)
    setSeed(seedFor('', settings))
    setView('compose')
  }

  return (
    <div ref={rootRef} className="app" data-view={view}>
      {view === 'onboarding' && <Onboarding candidate={candidate} hasPending={hasPending} onConnected={connect} />}
      {view === 'settings' && (
        <SettingsView
          api={api}
          candidate={candidate}
          settings={settings}
          recentTags={recentTags}
          onChange={updateSettings}
          onApiChange={(url) => {
            saveApi(url, settings)
            setApi(url)
            setCandidate('')
          }}
          onBack={() => {
            setCandidate('')
            setSeed(seedFor('', settings))
            setView('compose')
          }}
        />
      )}
      {view === 'compose' && (
        <Composer
          seed={seed}
          api={api}
          settings={settings}
          recentTags={recentTags}
          onOpenSettings={() => setView('settings')}
          onSent={() => {
            clearDraft()
            setRecentTags(loadRecentTags())
            setSeed(seedFor('', settings))
          }}
        />
      )}
    </div>
  )
}
