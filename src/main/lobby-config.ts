import { createLazyObject } from './lazy'

export const lobbyConfig = createLazyObject(
  [
    'practiceTool',
    () =>
      ({
        customGameLobby: {
          configuration: {
            gameMode: 'PRACTICETOOL',
            gameMutator: '',
            gameServerRegion: '',
            mapId: 11,
            mutators: { id: 1 },
            spectatorPolicy: 'AllAllowed',
            teamSize: 5
          },
          lobbyName: 'Alune',
          lobbyPassword: ''
        },
        isCustom: true
      }) as const
  ],
  [
    'rankedSolo5v5',
    () =>
      ({
        isCustom: false,
        queueId: 420
      }) as const
  ]
)

export type LobbyKind = keyof typeof lobbyConfig

export type LobbyConfig = (typeof lobbyConfig)[LobbyKind]
