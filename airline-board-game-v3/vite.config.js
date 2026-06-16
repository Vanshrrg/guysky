import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Version 3 — forked from the v2 offline solo build, with the End-Turn
// adjudication (engine/axis checks, win/lose, altitude/approach advancement,
// turn alternation) removed. Placement + switch/token reactions kept. Own base
// + dev port so it runs alongside the live game and v2.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/guysky-v3/',
  server: { port: 5176 },
})
