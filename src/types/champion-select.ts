export interface Player {
  championName: string
  displayName: string
  img: string
  index: number
  teamId: number
}

export type Ban = { id: number; isPicking: boolean; completed: boolean }

export type ChampionSelectSession = {
  myTeam: Player[] | null
  theirTeam: Player[] | null
  myTeamBans?: Ban[]
  theirTeamBans?: Ban[]
  banSize?: number
  phase?: 'BAN_PICK' | 'FINALIZATION' | 'GAME_STARTING'
}
