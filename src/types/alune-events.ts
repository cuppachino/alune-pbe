import type { ConnectionStatus, LobbyMatchmakingSearchState } from 'hexgate'
import type { EventPayload } from './events'
import type { ChampionSelectSession } from './champion-select'

export type AluneEventMap = {
  'get-status': [status: ConnectionStatus]
  'champ-select': [session: ChampionSelectSession]
  'preload-images': [lookup: { [id: number]: string }]
  'lobby-state': [
    state: {
      canStartActivity: boolean
      inChampSelect: boolean
      searchState: LobbyMatchmakingSearchState['searchState']
    }
  ]
}

export type AlunePayload = EventPayload<AluneEventMap>
