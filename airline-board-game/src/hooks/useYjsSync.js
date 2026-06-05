import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'

const ROOM = 'skyteam-game-v1'

export function useYjsSync() {
  const docRef = useRef(new Y.Doc())
  const providerRef = useRef(null)
  const sharedMapRef = useRef(docRef.current.getMap('game'))
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const provider = new WebrtcProvider(ROOM, docRef.current, {
      signaling: ['wss://signaling.yjs.dev'],
    })
    providerRef.current = provider

    const onStatus = () => setConnected(provider.connected)
    provider.on('synced', onStatus)
    provider.awareness.on('change', onStatus)

    return () => {
      provider.destroy()
    }
  }, [])

  return {
    doc: docRef.current,
    sharedMap: sharedMapRef.current,
    connected,
  }
}
