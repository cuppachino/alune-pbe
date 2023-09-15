import { useWebSocket } from '@renderer/websocket'

/**
 * Hook for getting the champ select recording buffer size.
 *
 * @platform `electron` | `web`
 */
export function useRecordingSize() {
  return useWebSocket('recording-size', 0)
}
