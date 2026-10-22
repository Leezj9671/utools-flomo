import { appendFileSync } from 'node:fs'
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

// uTools loads the built index.html via file://, so assets must be relative.
export default defineConfig({
  base: './',
  plugins: [react(), devLog()],
  build: {
    outDir: 'dist',
    // uTools 7.x runs Chrome 108; 8.x runs Chrome 132.
    target: 'chrome108',
    emptyOutDir: true,
  },
})
