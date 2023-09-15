import { Ban } from '@/types/champion-select'
import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

export function BanDisplay({
  teamId,
  bans,
  banSize,
  className,
  classNamePicking,
  classNameNotPicking,
  children,
  ...props
}: PropType<'div'> &
  PropsWithChildren<{
    teamId: number
    bans?: Ban[]
    banSize?: number
    classNamePicking?: string
    classNameNotPicking?: string
  }>) {
  return Array.from({ length: banSize ?? bans?.length ?? 0 }).map((_, i) => {
    const ban = bans?.[i]
    const shouldShow = ban && !(!ban.completed && ban.id === -1)
    return (
      <div
        {...props}
        className={twMerge(
          `relative bg-clip-content bg-no-repeat aspect-square overflow-hidden`,
          bans?.[i]?.isPicking ? classNamePicking : classNameNotPicking,
          className
        )}
        key={`team-${teamId}-ban-${i}`}
      >
        {shouldShow ? (
          <img
            className="scale-125 m-auto aspect-square"
            src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${bans[i].id}.png`}
          />
        ) : (
          children
        )}
      </div>
    )
  })
}
