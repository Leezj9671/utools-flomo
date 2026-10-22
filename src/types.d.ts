/// <reference types="vite/client" />
// Minimal typings for the uTools APIs this plugin uses, plus the preload bridge.

type EnterType = 'text' | 'img' | 'files' | 'regex' | 'over' | 'window'

interface PluginEnterAction {
  code: string
  type: EnterType
  payload: unknown
  from: 'main' | 'panel' | 'hotkey' | 'redirect'
}

interface UTools {
  onPluginEnter(cb: (action: PluginEnterAction) => void): void
  onPluginOut(cb: (isKill: boolean) => void): void
  onDbPull(cb: (docs: unknown[]) => void): void
  outPlugin(isKill?: boolean): void
  hideMainWindow(isFocusPrevWindow?: boolean): boolean
  /** uTools 8+. */
  setExpandHeight?(height: number): boolean
  /** uTools 7.x name for the same call (not in the 8.x docs; detected at runtime). */
  setExpendHeight?(height: number): boolean
  subInputBlur(): void
  removeSubInput(): boolean
  showNotification(body: string, clickFeatureCode?: string): void
  shellOpenExternal(url: string): Promise<void>
  isDarkColors(): boolean
  isMacOS(): boolean
  dbStorage: {
    setItem(key: string, value: unknown): void
    getItem<T = unknown>(key: string): T | null
    removeItem(key: string): void
  }
}

type SendErrorKind = 'invalid_api' | 'not_pro' | 'rate_limited' | 'network' | 'server' | 'rejected' | 'empty'

type SendResult = { ok: true; message: string } | { ok: false; kind: SendErrorKind; message: string }
type VerifyResult = ({ ok: true } | { ok: false; kind: SendErrorKind }) & { url?: string; message: string }

interface Services {
  parseApiUrl(input: string): string | null
  sendMemo(apiUrl: string, content: string, opts?: { markdown?: boolean }): Promise<SendResult>
  verifyApi(apiUrl: string): Promise<VerifyResult>
  readLocalApi(): string
  writeLocalApi(url: string): void
  clipboardApi(): string | null
  currentBrowserUrl(): Promise<string>
}

interface Window {
  utools?: UTools
  services?: Services
}
