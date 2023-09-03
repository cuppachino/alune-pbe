import { EventMap } from '@/types/events'
import { useState, useEffect } from 'react'
import CustomWebSocket from './websocket'

export function createWebSocketHook<T extends EventMap>(ws: CustomWebSocket<T>) {
  return function useWebSocket<K extends keyof T>(event: K, initialValue: T[K][0]) {
    const [value, setValue] = useState(initialValue)

    useEffect(() => {
      ws.sendMessage(event)
      const off = ws.on(event, (...payload) => {
        setValue(payload[0])
      })

      return () => {
        off()
      }
    }, [])

    return value
  }
}
