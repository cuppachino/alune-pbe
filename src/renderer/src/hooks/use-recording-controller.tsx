import { useWebSocket } from '@renderer/websocket'

/**
 * Hook to get the current LCU connection status.
 *
 * @platform `electron` | `web`
 */
export function useRecordingController() {
  return useWebSocket('recording-controller', 'disable')
}
