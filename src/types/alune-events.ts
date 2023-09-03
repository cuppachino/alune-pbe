import type { ConnectionStatus } from 'hexgate'
import type { EventPayload } from './events'
import type { ChampionSelectSession } from './champion-select'

export type AluneEventMap = {
  'get-status': [status: ConnectionStatus]
  'champ-select': [session: ChampionSelectSession]
}

export type AlunePayload = EventPayload<AluneEventMap>
