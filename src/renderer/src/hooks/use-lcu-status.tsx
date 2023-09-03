import { useWebSocket } from '@renderer/websocket'

/**
 * Hook to get the current LCU connection status.
 *
 * @platform `electron` | `web`
 */
export function useLcuStatus() {
  return useWebSocket('get-status', 'disconnected')
}
