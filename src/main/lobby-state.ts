import {
  LcuValue,
  extractDefined,
  type LobbyEvent,
  type LobbyMatchmakingSearchState,
  type OperationResponses
} from 'hexgate'

type LolLobbyState = OperationResponses<'GetLolLobbyV2LobbyMatchmakingSearchState'>

interface LobbyStateOptions {
  onUpdate: (
    self: LobbyState,
    state: { canStartActivity: boolean; searchState: LobbyMatchmakingSearchState['searchState'] }
  ) => void
}

export class LobbyState extends LcuValue<LolLobbyState> {
  protected onUpdate: LobbyStateOptions['onUpdate'] | null = null

  constructor(options?: Partial<LobbyStateOptions>) {
    super(({ build, unwrap }) =>
      unwrap(build('/lol-lobby/v2/lobby/matchmaking/search-state').method('get').create())
    )
    Object.assign(this, extractDefined(options))
  }

  get searchState() {
    return this.inner?.searchState ?? 'Invalid'
  }

  get data() {
    return {
      canStartActivity: this.canStartActivity,
      searchState: this.searchState
    }
  }

  handleLobbyEvent = ({ data, uri }: LobbyEvent) => {
    switch (uri) {
      case '/lol-lobby/v2/lobby':
        this.canStartActivity = !!data?.canStartActivity
        break
      case '/lol-lobby/v2/lobby/matchmaking/search-state':
        if (!this.inner) {
          this.inner = {}
        }
        this.inner.searchState = data?.searchState ?? 'Invalid'
        break
      case '/lol-lobby/v2/lobby/custom/available-bots':
      case '/lol-lobby/v2/lobby/custom/bots-enabled':
      case '/lol-lobby/v2/lobby/invitations':
      case '/lol-lobby/v2/lobby/members':
      case '/lol-lobby/v2/lobby/countdown':
        break
    }
    this.onUpdate?.(this, this.data)
  }

  public canStartActivity: boolean = false
}
