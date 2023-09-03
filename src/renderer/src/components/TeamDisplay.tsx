import { Player } from '@/types/champion-select'

export function TeamDisplay({ team }: { team: Player[] | null }) {
  return (
    <div className="flex w-full">
      {team?.map((p) => {
        return (
          <div
            className="bg-center bg-cover w-full h-full flex flex-col justify-between font-bold"
            style={{
              backgroundImage: `url(${p.img})`
            }}
            key={`team-${p.teamId}-cell-${p.index}`}
          >
            <span className="w-10 overflow-ellipsis">{p.championName}</span>
            <span className="w-10 overflow-ellipsis">{p.displayName}</span>
          </div>
        )
      })}
    </div>
  )
}
