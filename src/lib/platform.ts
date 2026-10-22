// Resolves the uTools runtime. Outside uTools (plain browser during `npm run dev`)
// a mock is installed so the UI can be developed and screenshotted.
// Query params drive the mock: ?code=excerpt&payload=...&fail=invalid_api&noapi=1&dark=1

const listeners: { enter?: (a: PluginEnterAction) => void } = {}

function installMock(): { utools: UTools; services: Services; isMock: true } {
  const q = new URLSearchParams(location.search)
  const store = (key: string) => `mock:${key}`
  if (q.has('reset')) localStorage.clear()
  if (q.has('noapi')) localStorage.removeItem(store('local-api'))
  else if (!localStorage.getItem(store('local-api'))) {
    localStorage.setItem(store('local-api'), 'https://flomoapp.com/iwh/MTIz/0123456789abcdef0123456789abcdef/')
  }

  const API = /https:\/\/flomoapp\.com\/iwh\/[A-Za-z0-9]+\/[A-Za-z0-9]{16,}\/?/i
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
  const fail = q.get('fail') as SendErrorKind | null

  const utools: UTools = {
    onPluginEnter(cb) {
      listeners.enter = cb
      setTimeout(() =>
        cb({
          code: q.get('code') || 'write',
          type: q.get('payload') ? 'over' : 'text',
          payload: q.get('payload') || '',
          from: 'main',
        }),
      )
    },
    onPluginOut() {},
    onDbPull() {},
    outPlugin: () => console.info('[mock] outPlugin'),
    hideMainWindow: () => true,
    setExpandHeight: (h) => {
      document.documentElement.style.setProperty('--mock-height', `${h}px`)
      return true
    },
    subInputBlur() {},
    removeSubInput: () => true,
    showNotification: (body) => console.info('[mock] notification:', body),
    shellOpenExternal: async (url) => void window.open(url, '_blank'),
    isDarkColors: () => q.has('dark') || matchMedia('(prefers-color-scheme: dark)').matches,
    isMacOS: () => /Mac/.test(navigator.platform),
    dbStorage: {
      setItem: (k, v) => localStorage.setItem(store(k), JSON.stringify(v)),
      getItem: (k) => JSON.parse(localStorage.getItem(store(k)) ?? 'null'),
      removeItem: (k) => localStorage.removeItem(store(k)),
    },
  }

  const services: Services = {
    parseApiUrl: (input) => {
      const m = String(input).match(API)
      return m ? (m[0].endsWith('/') ? m[0] : m[0] + '/') : null
    },
    async sendMemo(_url, content) {
      await wait(700)
      console.info('[mock] sendMemo\n' + content)
      if (fail) return { ok: false, kind: fail, message: fail === 'invalid_api' ? 'API 地址验证失败' : '模拟的失败' }
      return { ok: true, message: '已记录' }
    },
    async verifyApi(url) {
      await wait(600)
      const parsed = services.parseApiUrl(url)
      if (!parsed) return { ok: false, kind: 'invalid_api', message: '没有识别到 flomo API 地址，应形如 https://flomoapp.com/iwh/xxx/xxx/' }
      if (fail === 'invalid_api') return { ok: false, kind: 'invalid_api', url: parsed, message: 'API 地址验证失败' }
      return { ok: true, url: parsed, message: '已连接' }
    },
    readLocalApi: () => localStorage.getItem(store('local-api')) ?? '',
    writeLocalApi: (url) =>
      url ? localStorage.setItem(store('local-api'), url) : localStorage.removeItem(store('local-api')),
    clipboardApi: () => null,
    currentBrowserUrl: async () => q.get('source') ?? 'https://example.com/articles/how-to-take-notes',
  }

  return { utools, services, isMock: true }
}

function realRuntime() {
  if (!window.utools || !window.services) {
    throw new Error((window as { __preloadError?: string }).__preloadError ?? 'uTools runtime or preload bridge not available')
  }
  return { utools: window.utools, services: window.services, isMock: false as const }
}

// The mock only exists in dev builds; production bundles drop it entirely.
const runtime = import.meta.env.DEV && !window.utools ? installMock() : realRuntime()

export const utools = runtime.utools
export const services = runtime.services
export const isMock = runtime.isMock
export const modKey = utools.isMacOS() ? '⌘' : 'Ctrl'

/** Resize the uTools panel. uTools 8 has setExpandHeight; 7.x only the older setExpendHeight. */
export function setPanelHeight(height: number) {
  if (typeof utools.setExpandHeight === 'function') utools.setExpandHeight(height)
  else if (typeof utools.setExpendHeight === 'function') utools.setExpendHeight(height)
}
