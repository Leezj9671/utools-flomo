// Bridge between the UI and local capabilities. Only exposes what the UI needs.
// Network traffic goes to flomoapp.com and nowhere else.
'use strict'

try {
  const fs = require('node:fs')
  const os = require('node:os')
  const path = require('node:path')
  const { clipboard } = require('electron')
  const flomo = require('./lib/flomo.js')

  const SECRET_FILE = 'flomo-api.json'

  // uTools 8 provides a per-plugin data dir; uTools 7.x does not, so fall back to the
  // platform's standard per-user app data location.
  function dataDir() {
    if (typeof utools.getPluginLocalDataPath === 'function') return utools.getPluginLocalDataPath()
    const base =
      process.platform === 'darwin'
        ? path.join(os.homedir(), 'Library', 'Application Support')
        : process.platform === 'win32'
          ? process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
          : process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
    return path.join(base, 'utools-flomo')
  }

  function secretPath() {
    return path.join(dataDir(), SECRET_FILE)
  }

  window.services = {
    parseApiUrl: flomo.parseApiUrl,
    sendMemo: flomo.sendMemo,
    verifyApi: flomo.verifyApi,

    /** API URL kept on this device only (not part of uTools sync). */
    readLocalApi() {
      try {
        return JSON.parse(fs.readFileSync(secretPath(), 'utf8')).url || ''
      } catch {
        return ''
      }
    },
    writeLocalApi(url) {
      const file = secretPath()
      if (!url) {
        fs.rmSync(file, { force: true })
        return
      }
      fs.mkdirSync(path.dirname(file), { recursive: true })
      fs.writeFileSync(file, JSON.stringify({ url }), { encoding: 'utf8', mode: 0o600 })
    },

    /** Returns a flomo API URL if one is sitting in the clipboard. */
    clipboardApi() {
      try {
        return flomo.parseApiUrl(clipboard.readText())
      } catch {
        return null
      }
    },

    async currentBrowserUrl() {
      if (utools.isLinux()) return ''
      try {
        return (await utools.readCurrentBrowserUrl()) || ''
      } catch {
        return ''
      }
    },
  }
} catch (err) {
  // Surfaced by src/lib/devlog.ts in development.
  window.__preloadError = String((err && err.stack) || err)
}
