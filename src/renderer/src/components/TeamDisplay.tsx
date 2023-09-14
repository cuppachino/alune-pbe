import { Player } from '@/types/champion-select'
import { twMerge } from 'tailwind-merge'

export function TeamDisplay({
  team,
  className,
  ...props
}: { team: Player[] | null } & PropType<'div'>) {
  return team?.map((p) => {
    return (
      <div
        {...props}
        className={twMerge(
          'bg-center bg-cover w-full h-full flex flex-col justify-between font-bold',
          className
        )}
        style={{
          backgroundImage: `url(${p.img})`
        }}
        key={`team-${p.teamId}-cell-${p.index}`}
      >
        <span className="w-10 overflow-ellipsis">{p.championName}</span>
        <span className="w-10 overflow-ellipsis">{p.displayName}</span>
      </div>
    )
  })
}
