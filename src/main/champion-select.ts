import { ChampionSelectSession, Player } from '@/types/champion-select'
import { updatedDiff } from 'deep-object-diff'
import {
  BaseLogger,
  CreateWithRecipe,
  Hexgate as HttpsClient,
  LcuComponents,
  LcuEventType,
  ResolveLogger,
  extractDefined
} from 'hexgate'
import { ChampionLookup } from './champion-lookup'

/**
 * A champion select session. This represents the state of champion select.
 */
export interface LolChampSelectSession extends _LolChampSelectSession {}
type _LolChampSelectSession = LcuComponents['schemas']['LolChampSelectChampSelectSession']

/**
 * Alune player selection in `LolChampSelectSession`. This represents each player's selection state during champion select.
 */
export interface LolChampSelectPlayerSelection extends _LolChampSelectPlayerSelection {}
type _LolChampSelectPlayerSelection =
  LcuComponents['schemas']['LolChampSelectChampSelectPlayerSelection']

/**
 * A champion data type.
 */
export type LolCollectionsChampion = {
  default: LcuComponents['schemas']['LolChampionsCollectionsChampion']
  minimal: LcuComponents['schemas']['LolChampionsCollectionsChampionMinimal']
}

export interface ChampionSelectConfig<Logger extends BaseLogger | undefined> {
  onUpdate: (session: LolChampSelectSession) => void
  championLookup: ChampionLookup
  logger: Logger
}

export interface UnsafeChampSelect<Logger extends BaseLogger | undefined>
  extends ChampionSelect<Logger> {
  utils: null
}

export interface SafeChampSelect<Logger extends BaseLogger | undefined>
  extends ChampionSelect<Logger> {
  utils: NonNullable<ChampionSelect<Logger>['utils']>
}

export class ChampionSelect<Logger extends BaseLogger | undefined> extends CreateWithRecipe<{
  [summonerId: number]: string
}> {
  protected onUpdate: ((session: ChampionSelectSession) => void) | null = null
  protected prev: Omit<LolChampSelectSession, 'timer'> = {}
  inChampSelect: boolean = false
  current: ChampionSelectSession | null = null
  protected championLookup!: ChampionLookup
  protected summonerLookup: Record<number, string> = {}
  logger = console as ResolveLogger<Logger>
  utils: {
    getSummoners: (...summonerIds: number[] | number[][]) => Promise<Record<number, string>>
  } | null = null

  constructor(options?: Partial<ChampionSelectConfig<Logger>>) {
    super(({ build, wrap }) =>
      wrap(build('/lol-summoner/v2/summoner-names').method('get').create())({
        from(...summonerIds: number[] | number[][]) {
          return [
            {
              ids: JSON.stringify(summonerIds.flat())
            }
          ]
        },
        async to(res) {
          return Object.fromEntries(
            (await res).data.map(
              ({ displayName, summonerId }) => [summonerId!, displayName!] as const
            )
          ) as {
            [summonerId: number]: string
          }
        }
      })
    )

    Object.assign(this, extractDefined(options))
    if (!options?.championLookup) {
      this.championLookup = new ChampionLookup()
    }
    this.update = this.update.bind(this)
    this.assertOk = this.assertOk.bind(this)
    this.isOk = this.isOk.bind(this)
    this.ok = this.ok.bind(this)
    this.handleEventType = this.handleEventType.bind(this)
    this.shouldUpdate = this.shouldUpdate.bind(this)
    this.handleChampSelect = this.handleChampSelect.bind(this)
    this.extractSummonerIds = this.extractSummonerIds.bind(this)
  }

  async update(httpsClient: HttpsClient | null) {
    this.inChampSelect = false
    await this.championLookup.update(httpsClient)
    if (httpsClient) {
      this.utils = {
        getSummoners: this.recipe(httpsClient)
      }
    } else {
      this.utils = null
      this.summonerLookup = {}
    }
  }

  assertOk(): asserts this is SafeChampSelect<ResolveLogger<Logger>> {
    if (!this.isOk()) {
      throw new Error('ChampionSelect is not ok!')
    }
  }

  isOk(): this is SafeChampSelect<ResolveLogger<Logger>> {
    return this.utils !== null
  }

  ok(): (this & SafeChampSelect<ResolveLogger<Logger>>) | undefined {
    if (this.isOk()) {
      return this
    }
    return undefined
  }

  extractSummonerIds(team: LolChampSelectPlayerSelection[] | undefined) {
    if (!team) return []
    return team.map((p) => p.summonerId).filter(Boolean)
  }

  protected async handleEventType(data: LolChampSelectSession, eventType: LcuEventType) {
    this.assertOk()
    if (eventType === 'Delete') {
      this.inChampSelect = false
      this.logger.debug({ eventType }, 'event')
    }
    if (eventType === 'Create') {
      this.inChampSelect = true
      this.logger.debug({ eventType }, 'building summoner lookup')
      this.summonerLookup = await this.utils.getSummoners(
        this.extractSummonerIds(data.myTeam),
        this.extractSummonerIds(data.theirTeam)
      )
    }
  }

  protected async mapTeam(
    this: this & SafeChampSelect<ResolveLogger<Logger>>,
    team: LcuComponents['schemas']['LolChampSelectChampSelectPlayerSelection'][]
  ) {
    return team.map((p): Player => {
      const { championName, splashImage: img } = this.championLookup.championById(p.championId)
      const backupDisplayName = p.assignedPosition || 'TODO'
      const displayName = p.summonerId
        ? this.summonerLookup[p.summonerId] || backupDisplayName
        : backupDisplayName
      return {
        index: p.cellId!,
        championName,
        displayName,
        img,
        teamId: p.team ?? 0
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldUpdate = ({ timer, ...data }: LolChampSelectSession) => {
    const diff = updatedDiff(this.prev, data)
    const shouldUpdate = Object.keys(diff).length > 0
    if (shouldUpdate) this.logger.debug({ diff }, 'champ select session diff')
    return shouldUpdate
  }

  public handleChampSelect = async ({
    data,
    eventType
  }: {
    data: LolChampSelectSession
    eventType: LcuEventType
  }) => {
    this.assertOk()
    this.handleEventType(data, eventType)

    if (this.shouldUpdate(data)) {
      const myTeam = await this.mapTeam(data.myTeam ?? [])
      const theirTeam = await this.mapTeam(data.theirTeam ?? [])
      this.onUpdate?.({ myTeam, theirTeam })
      this.current = { myTeam, theirTeam }
    }
    this.prev = data
  }
}
