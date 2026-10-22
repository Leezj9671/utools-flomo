import { services, utools } from './platform'

export interface Settings {
  defaultTags: string[]
  markdown: boolean
  autoHide: boolean
  withSource: boolean
  syncApi: boolean
}

const DEFAULTS: Settings = {
  defaultTags: [],
  markdown: true,
  autoHide: true,
  withSource: true,
  syncApi: false,
}

const KEY = {
  settings: 'settings',
  recentTags: 'recent-tags',
  syncedApi: 'synced-api',
}
const DRAFT_KEY = 'flomo-draft'
const RECENT_LIMIT = 24

// Settings and tag history are small user preferences: keep them in the synced db.
export function loadSettings(): Settings {
  return { ...DEFAULTS, ...(utools.dbStorage.getItem<Partial<Settings>>(KEY.settings) ?? {}) }
}

export function saveSettings(settings: Settings) {
  utools.dbStorage.setItem(KEY.settings, settings)
}

export function loadRecentTags(): string[] {
  return utools.dbStorage.getItem<string[]>(KEY.recentTags) ?? []
}

export function rememberTags(tags: string[]) {
  if (!tags.length) return
  const merged = [...tags, ...loadRecentTags().filter((t) => !tags.includes(t))].slice(0, RECENT_LIMIT)
  utools.dbStorage.setItem(KEY.recentTags, merged)
}

// The API URL is a secret. By default it lives in a local file on this device only;
// the user can opt in to syncing it through their uTools account.
export function loadApi(settings: Settings): string {
  if (settings.syncApi) return utools.dbStorage.getItem<string>(KEY.syncedApi) ?? services.readLocalApi()
  return services.readLocalApi()
}

export function saveApi(url: string, settings: Settings) {
  services.writeLocalApi(url)
  if (settings.syncApi && url) utools.dbStorage.setItem(KEY.syncedApi, url)
  else utools.dbStorage.removeItem(KEY.syncedApi)
}

// Drafts are per-device scratch state, so plain localStorage is enough.
export interface Draft {
  text: string
  quote: string
  source: string
  tags: string[]
}

export function loadDraft(): Draft | null {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null')
  } catch {
    return null
  }
}

export function saveDraft(draft: Draft) {
  try {
    if (!draft.text.trim() && !draft.quote.trim()) localStorage.removeItem(DRAFT_KEY)
    else localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // Draft persistence is best effort.
  }
}

export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}
