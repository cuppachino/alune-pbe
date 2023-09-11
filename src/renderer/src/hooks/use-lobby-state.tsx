import { useWebSocket } from '@renderer/websocket'

/**
 * Hook to get the current lobby state.
 *
 * @platform `electron` | `web`
 */
export function useLobbyState() {
  return useWebSocket('lobby-state', {
    canStartActivity: false,
    searchState: 'Invalid',
    inChampSelect: false
  })
}
