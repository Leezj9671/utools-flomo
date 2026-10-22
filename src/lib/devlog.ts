// Dev only: forward runtime errors and an environment report to the Vite dev server.
// Imported first in main.tsx so it is in place before anything else can throw.

export function report(kind: string, detail: unknown) {
  if (!import.meta.env.DEV) return
  const payload = JSON.stringify({ kind, detail }, (_k, v) =>
    v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v,
  )
  try {
    navigator.sendBeacon('/__devlog', payload)
  } catch {
    // nothing else to do
  }
}

if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => report('error', e.error ?? e.message))
  window.addEventListener('unhandledrejection', (e) => report('unhandledrejection', e.reason))

  const u = window.utools as unknown as Record<string, unknown> | undefined
  const s = window.services as unknown as Record<string, unknown> | undefined
  report('env', {
    userAgent: navigator.userAgent,
    hasUtools: Boolean(u),
    hasServices: Boolean(s),
    services: s ? Object.keys(s) : [],
    missingUtoolsApis: u
      ? [
          'onPluginEnter', 'onPluginOut', 'onDbPull', 'outPlugin', 'hideMainWindow', 'setExpandHeight',
          'subInputBlur', 'removeSubInput', 'showNotification', 'shellOpenExternal', 'isDarkColors', 'isMacOS',
          'isLinux', 'readCurrentBrowserUrl', 'getPluginLocalDataPath', 'dbStorage',
        ].filter((k) => !(k in u))
      : [],
    legacySetExpendHeight: Boolean(u && 'setExpendHeight' in u),
    preloadError: (window as unknown as { __preloadError?: string }).__preloadError,
  })
}
