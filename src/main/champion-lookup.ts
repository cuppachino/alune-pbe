import { LcuValue } from 'hexgate'

export type ChampionDto = {
  championName: string
  championId: number
  splashImage: string
  squareImage: string
}

export const DEFAULT_IMAGE = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`
export const NONE_CHAMPION = {
  championName: 'None',
  championId: -1,
  splashImage: DEFAULT_IMAGE,
  squareImage: DEFAULT_IMAGE
}
export class ChampionLookup extends LcuValue<Map<number, ChampionDto>> {
  constructor() {
    super(({ build, wrap }) => {
      // return unwrap(build('/lol-champions/v1/owned-champions-minimal').method('get').create())
      // let currentSummonerId: number | null = null
      // const getCurrentSummonerId = wrap(
      //   build('/lol-summoner/v1/current-summoner').method('get').create()
      // )({
      //   async to(res) {
      //     return (await res).data.summonerId!
      //   }
      // })
      return wrap(
        build('/lol-champions/v1/owned-champions-minimal').method('get').create()
        // build('/lol-champions/v1/inventories/{summonerId}/champions').method('get').create()
      )({
        // async from() {
        //   if (currentSummonerId === null) {
        //     currentSummonerId = await getCurrentSummonerId()
        //   }
        //   return [
        //     {
        //       summonerId: JSON.stringify(currentSummonerId)
        //     }
        //   ]
        // },
        async to(res) {
          return new Map(
            (await res).data.map(({ name, id }) => {
              return [
                id!,
                {
                  championName: name!,
                  championId: id!,
                  splashImage: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${id!}/${id!}000.jpg`,
                  squareImage: `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`
                } satisfies ChampionDto
              ] as const
            })
          ).set(-1, NONE_CHAMPION)
        }
      })
    })
  }

  championById(id: string | number | undefined): ChampionDto {
    return this.inner?.get(Number(id)) ?? NONE_CHAMPION
  }

  images = () => {
    if (!this.inner) {
      throw new Error('Champion lookup not initialized')
    }
    const images: {
      [id: number]: {
        splash: string
        square: string
      }
    } = {}
    this.inner?.forEach(({ championId, splashImage, squareImage }) => {
      images[championId] = { splash: splashImage, square: squareImage }
    })
    return images
  }
}
