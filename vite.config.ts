import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Dev only: the plugin page POSTs runtime errors here (see src/lib/devlog.ts), so errors
// inside uTools show up in the terminal and in .devlog without opening DevTools.
function devLog(): Plugin {
  return {
    name: 'utools-devlog',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__devlog', (req, res) => {
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          const line = `[${new Date().toISOString()}] ${body}\n`
          appendFileSync('.devlog', line)
          server.config.logger.warn(`[uTools] ${body}`)
          res.statusCode = 204
          res.end()
        })
      })
    },
  }
}

// Build only: the release package must not point at the dev server.
function releasePluginJson(): Plugin {
  return {
    name: 'utools-release-plugin-json',
    apply: 'build',
    closeBundle() {
      const file = 'dist/plugin.json'
      const json = JSON.parse(readFileSync(file, 'utf8'))
      delete json.development
      writeFileSync(file, JSON.stringify(json, null, 2) + '\n')
    },
  }
}

// uTools loads the built index.html via file://, so assets must be relative.
export default defineConfig({
  base: './',
  plugins: [react(), devLog(), releasePluginJson()],
  build: {
    outDir: 'dist',
    // uTools 7.x runs Chrome 108; 8.x runs Chrome 132.
    target: 'chrome108',
    emptyOutDir: true,
  },
})
