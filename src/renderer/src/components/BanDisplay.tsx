import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

export function BanDisplay({
  teamId,
  bans,
  className,
  children,
  ...props
}: PropType<'div'> & PropsWithChildren<{ teamId: number; bans?: number[] }>) {
  return bans?.map((id) => {
    return (
      <div
        {...props}
        className={twMerge(
          `relative bg-clip-content bg-no-repeat aspect-square overflow-hidden`,
          className
        )}
        key={`team-${teamId}-ban-${id}`}
      >
        {id !== undefined ? (
          <img
            className="scale-[1.15] m-auto aspect-square"
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${id}.png`}
          />
        ) : (
          children
        )}
      </div>
    )
  })
}
