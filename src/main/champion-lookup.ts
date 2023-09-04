import { LcuValue, createRecipe } from 'hexgate'
import { LolCollectionsChampion } from './champion-select'

export class ChampionLookup extends LcuValue<LolCollectionsChampion['default'][]> {
  constructor() {
    super(
      createRecipe(({ build, wrap, to }) => {
        let currentSummonerId: number | null = null
        const getCurrentSummonerId = wrap(
          build('/lol-summoner/v1/current-summoner').method('get').create()
        )({
          async to(res) {
            return (await res).data.summonerId!
          }
        })
        return wrap(
          build('/lol-champions/v1/inventories/{summonerId}/champions').method('get').create()
        )({
          async from() {
            if (currentSummonerId === null) {
              currentSummonerId = await getCurrentSummonerId()
            }
            return [
              {
                summonerId: JSON.stringify(currentSummonerId)
              }
            ]
          },
          to
        })
      })
    )
  }

  championById(id: string | number | undefined) {
    return this.inner?.find((c) => c.id === Number(id ?? 0))
  }
}
