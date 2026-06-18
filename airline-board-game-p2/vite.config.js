import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Multiplayer build (was the Patch-2 solo build). Syncs over Firebase RTDB
// node /game-mp (separate from v1's /guysky → /game). Deployed to gh-pages at
// /guysky-mp/. Own dev port so it can run alongside the other builds.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/guysky/guysky-mp/',
  server: { port: 5175 },
})
