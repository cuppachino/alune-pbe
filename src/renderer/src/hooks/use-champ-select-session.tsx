import { useWebSocket } from '@renderer/websocket'

/**
 * @platform `web` | `electron`
 */
export function useChampSelectSession() {
  return useWebSocket('champ-select', {
    myTeam: null,
    theirTeam: null
  })
}
