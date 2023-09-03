export interface Player {
  championName: string
  displayName: string
  img: string
  index: number
  teamId: number
}

export type ChampionSelectSession = {
  myTeam: Player[] | null
  theirTeam: Player[] | null
}
