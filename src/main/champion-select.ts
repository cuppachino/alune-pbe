/* eslint-disable @typescript-eslint/no-empty-interface */
import { ChampionSelectSession, Player } from '@/types/champion-select'
import { updatedDiff } from 'deep-object-diff'
import {
  LcuEventType,
  BaseLogger,
  LcuComponents,
  OperationResponses,
  createRecipe,
  ResolveLogger,
  extractDefined,
  Hexgate as HttpsClient,
  RecipeFn
} from 'hexgate'

type _LolChampSelectSession = LcuComponents['schemas']['LolChampSelectChampSelectSession']
export interface LolChampSelectSession extends _LolChampSelectSession {}

type _LolChampSelectPlayerSelection =
  LcuComponents['schemas']['LolChampSelectChampSelectPlayerSelection']
export interface LolChampSelectPlayerSelection extends _LolChampSelectPlayerSelection {}

export interface LolOwnedChampionsMinimal
  extends OperationResponses<'GetLolChampionsV1OwnedChampionsMinimal'> {}

export type ChampSelectUtils = ReturnType<typeof createChampSelectUtils>
export const createChampSelectUtils = createRecipe(({ build, wrap, unwrap }) => ({
  championLookup: wrap(build('/lol-champions/v1/owned-champions-minimal').method('get').create())({
    from() {
      return [{}]
    },
    to: unwrap('should never error!')<LolOwnedChampionsMinimal>
  }),
  summonerLookup: wrap(build('/lol-summoner/v2/summoner-names').method('get').create())({
    from(...summonerIds: number[] | number[][]) {
      return [
        {
          ids: JSON.stringify(summonerIds.flat())
        }
      ]
    },
    async to(res) {
      return Object.fromEntries(
        (await res).data.map(({ displayName, summonerId }) => [summonerId!, displayName!] as const)
      ) as {
        [summonerId: number]: string
      }
    }
  })
}))

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

interface UpdatesWithHttpsClient<T> {
  update(httpsClient: HttpsClient | null): void
  isOk(): this is this & T
  ok(): (this & this & T) | undefined
}

interface SafeLcuValue<T> extends LcuValue<T> {
  value: NonNullable<LcuValue<T>['value']>
}

class LcuValue<T> implements UpdatesWithHttpsClient<SafeLcuValue<T>> {
  constructor(protected recipe: RecipeFn<() => Promise<T>>) {}

  value: T | null = null

  async update(httpsClient: HttpsClient | null): Promise<void> {
    if (httpsClient === null) {
      this.value = null
    } else {
      const value = await this.recipe(httpsClient)()
      this.value = value
    }
  }

  isOk(): this is this & SafeLcuValue<T> {
    return this.value !== null
  }

  ok(): (this & SafeLcuValue<T>) | undefined {
    if (this.isOk()) {
      return this
    }
    return undefined
  }
}

class ChampionLookup extends LcuValue<LolOwnedChampionsMinimal> {
  constructor() {
    super(
      createRecipe(({ build, wrap, unwrap }) =>
        wrap(build('/lol-champions/v1/owned-champions-minimal').method('get').create())({
          from() {
            return [{}]
          },
          to: unwrap('should never error!')<LolOwnedChampionsMinimal>
        })
      )
    )
  }

  championById(id: string | number | undefined) {
    return this.value?.find((c) => c.id === Number(id ?? 0))
  }
}

export class ChampionSelect<Logger extends BaseLogger | undefined> {
  protected onUpdate: ((session: ChampionSelectSession) => void) | null = null
  protected prev: Omit<LolChampSelectSession, 'timer'> = {}
  current: ChampionSelectSession | null = null
  utils: ChampSelectUtils | null = null
  protected championLookup!: ChampionLookup
  protected summonerLookup: Record<number, string> = {}
  logger = console as ResolveLogger<Logger>

  constructor(options?: Partial<ChampionSelectConfig<Logger>>) {
    Object.assign(this, extractDefined(options))
    if (!options?.championLookup) {
      this.championLookup = new ChampionLookup()
    }
  }

  update(httpsClient: HttpsClient | null) {
    this.championLookup.update(httpsClient)
    if (httpsClient === null) {
      this.utils = null
      // this.championLookup = null
      this.summonerLookup = {}
      return
    } else {
      this.utils = createChampSelectUtils(httpsClient)
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
      this.logger.debug({ eventType }, 'event')
    }
    if (eventType === 'Create') {
      this.logger.debug({ eventType }, 'building summoner lookup')
      this.summonerLookup = await this.utils.summonerLookup(
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
      const champ = this.championLookup.championById(p.championId)
      const id = champ?.id ?? -1
      const noSelectionImg = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`
      const img = champ?.id
        ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${id}/${id}000.jpg`
        : noSelectionImg

      return {
        index: p.cellId!,
        championName: champ?.name ?? '',
        displayName: p.summonerId
          ? this.summonerLookup[p.summonerId]
          : p.assignedPosition ?? 'TODO',
        img,
        teamId: p.team!
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected shouldUpdate({ timer, ...data }: LolChampSelectSession) {
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
