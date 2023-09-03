import type { OperationResponses } from 'hexgate'
import type { ArrayItem } from '.'

export type ChampionMinimal = NonNullable<
  ArrayItem<OperationResponses<'GetLolChampionsV1OwnedChampionsMinimal'>>
>
