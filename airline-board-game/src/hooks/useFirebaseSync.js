/**
 * useFirebaseSync.js
 * Firebase Realtime Database presence via plain REST polling.
 *
 * Why polling instead of SSE for presence:
 *  - Firebase SSE delivers path-scoped events: the initial connect gives the
 *    full map at path "/", but a newly-joined child arrives as a *partial*
 *    event (path "/<clientId>", data = just that child). The old code ignored
 *    the path and fed the partial straight into Object.values(...).filter(...),
 *    which wiped the peers list the instant a 2nd player joined — both devices
 *    then fell back to "Player 1". (Confirmed against the live DB.)
 *  - The RTDB endpoint is HTTP/1.1, so the browser caps at 6 connections per
 *    host. The app already runs 6 game-state EventSources; dropping presence
 *    off SSE keeps us under that ceiling.
 *
 * Polling is trivially correct here: presence changes rarely, a GET always
 * returns the full snapshot, and a lastSeen heartbeat lets us expire ghosts
 * left behind by tabs that closed without a clean unmount.
 */

import { useEffect, useRef, useState } from 'react'

const DB_URL = 'https://guysky-95670-default-rtdb.asia-southeast1.firebasedatabase.app'
const GAME_PATH = '/game'

const HEARTBEAT_MS = 3000  // re-announce our presence this often
const POLL_MS = 2000       // re-read the presence map this often
// Drop a peer whose heartbeat is older than this. Generous because browsers
// throttle background-tab timers (a hidden tab's heartbeat can stall well past
// the nominal interval); a tight window would drop a peer whose phone merely
// locked or who switched apps. We also re-announce immediately on refocus.
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

    // Announce / refresh our own presence with a fresh heartbeat.
    const announce = () =>
      fbSet(`/presence/${clientId}`, {
        clientId,
        joinedAt: joinedAtRef.current,
        lastSeen: Date.now(),
      })

    // Read the full presence map, drop stale/legacy entries, sort by joinedAt.
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
            p.lastSeen && (now - p.lastSeen) < STALE_MS  // excludes ghosts w/o a recent heartbeat
          )
          .sort((a, b) => a.joinedAt - b.joinedAt)
        setPeers(list)
      } catch {
        if (!cancelled) setConnected(false)
      }
    }

    // Announce first so our own entry exists before the first read.
    announce().then(refresh)
    const hb = setInterval(announce, HEARTBEAT_MS)
    const poll = setInterval(refresh, POLL_MS)

    // Background tabs throttle the heartbeat interval, so the moment we become
    // visible/focused again, announce + refresh immediately — this resurrects a
    // peer that was throttled past STALE_MS and pulls a fresh presence map.
    const onActive = () => {
      if (document.visibilityState === 'visible') announce().then(refresh)
    }
    document.addEventListener('visibilitychange', onActive)
    window.addEventListener('focus', onActive)

    // Best-effort removal on tab close (keepalive lets it finish after unload).
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
