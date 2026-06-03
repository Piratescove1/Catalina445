import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import fs from 'node:fs'
import path from 'node:path'

// Stamp a unique build id into the service worker's cache name so every deploy
// produces a different sw.js. The browser then detects the change, installs the
// new worker, and (via its activate handler) purges the previous cache —
// guaranteeing users get the latest app without manual cache clearing.
function stampServiceWorker() {
  return {
    name: 'stamp-service-worker',
    apply: 'build',
    closeBundle() {
      const swPath = path.resolve('dist/sw.js')
      if (!fs.existsSync(swPath)) return
      const buildId = Date.now().toString(36)
      const src = fs.readFileSync(swPath, 'utf8').replace(/__BUILD_ID__/g, buildId)
      fs.writeFileSync(swPath, src)
      console.log(`[stamp-service-worker] cache name -> c445-${buildId}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), basicSsl(), stampServiceWorker()],
  server: {
    host: true,
    https: true,
  },
  resolve: {
    conditions: ['browser', 'import', 'module', 'default'],
  },
})
