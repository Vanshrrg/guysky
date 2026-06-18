/**
 * useFirebaseSync.js  (multiplayer build — node: /game-mp)
 * Firebase Realtime Database presence via plain REST polling.
 *
 * Why polling instead of SSE for presence:
 *  - Firebase SSE delivers path-scoped events: a newly-joined child arrives as a
 *    *partial* event (path "/<clientId>"), which the old code fed straight into
 *    Object.values(...).filter(...), wiping the peers list the instant a 2nd
 *    player joined — both devices then fell back to "Player 1".
 *  - The RTDB endpoint is HTTP/1.1 (6 connections/host cap); dropping presence
 *    off SSE keeps us under that ceiling alongside the single /game-mp stream.
 *
 * Polling is trivially correct here: presence changes rarely, a GET always
 * returns the full snapshot, and a lastSeen heartbeat expires ghosts.
 *
 * NOTE: this build uses a SEPARATE node `/game-mp` from the v1 game (`/game`),
 * because the v2 schema (traffic/axis/supply) differs and must not collide.
 */

import { useEffect, useRef, useState } from 'react'

const DB_URL = 'https://guysky-95670-default-rtdb.asia-southeast1.firebasedatabase.app'
const GAME_PATH = '/game-mp'

const HEARTBEAT_MS = 3000  // re-announce our presence this often
const POLL_MS = 2000       // re-read the presence map this often
// Drop a peer whose heartbeat is older than this. Generous because browsers
// throttle background-tab timers; we also re-announce immediately on refocus.
const STALE_MS = 30000

function dbUrl(path) {
  return `${DB_URL}${GAME_PATH}${path}.json`
}

// Write a value to Firebase (PUT). Exported for reuse by callers.
export async function fbSet(path, value) {
  try {
    await fetch(dbUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    })
  } catch (e) {
    console.warn('fbSet error', e)
  }
}

export function useFirebaseSync(clientId) {
  const [peers, setPeers] = useState([])      // sorted by joinedAt — index 0 is Player 1
  const [connected, setConnected] = useState(false)
  const joinedAtRef = useRef(Date.now())      // stable for this session

  useEffect(() => {
    let cancelled = false

    const announce = () =>
      fbSet(`/presence/${clientId}`, {
        clientId,
        joinedAt: joinedAtRef.current,
        lastSeen: Date.now(),
      })

    const refresh = async () => {
      try {
        const res = await fetch(dbUrl('/presence'))
        const data = await res.json()
        if (cancelled) return
        setConnected(true)
        if (!data) { setPeers([]); return }
        const now = Date.now()
        const list = Object.values(data)
          .filter(p =>
            p && p.clientId && p.joinedAt &&
            p.lastSeen && (now - p.lastSeen) < STALE_MS
          )
          .sort((a, b) => a.joinedAt - b.joinedAt)
        setPeers(list)
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    announce().then(refresh)
    const hb = setInterval(announce, HEARTBEAT_MS)
    const poll = setInterval(refresh, POLL_MS)

    const onActive = () => {
      if (document.visibilityState === 'visible') announce().then(refresh)
    }
    document.addEventListener('visibilitychange', onActive)
    window.addEventListener('focus', onActive)

    const removeSelf = () =>
      fetch(dbUrl(`/presence/${clientId}`), { method: 'DELETE', keepalive: true }).catch(() => {})
    window.addEventListener('beforeunload', removeSelf)

    return () => {
      cancelled = true
      clearInterval(hb)
      clearInterval(poll)
      document.removeEventListener('visibilitychange', onActive)
      window.removeEventListener('focus', onActive)
      window.removeEventListener('beforeunload', removeSelf)
      removeSelf()
    }
  }, [clientId])

  return { connected, peers }
}
