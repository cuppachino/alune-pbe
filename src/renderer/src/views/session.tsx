import { BanDisplay } from '@renderer/components/BanDisplay'
import { TeamDisplay } from '@renderer/components/TeamDisplay'
import { useChampSelectSession } from '@renderer/hooks/use-champ-select-session'

export default function ChampSelectView() {
  const session = useChampSelectSession()

  return (
    <div className="absolute bottom-0 inset-x-0 min-h-[30%] w-full grid grid-flow-col">
      <span className="grid-span-1">
        <div className="absolute bottom-full left-0 flex w-fit h-1/3">
          <BanDisplay className="flex h-full" teamId={0} bans={session.myTeamBans}>
            {/* diagonal line */}
            <svg
              className="absolute w-full h-full p-2"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <path d="M0 100 L100 0" stroke="white" strokeWidth="1" />
            </svg>
          </BanDisplay>
        </div>
        <div className="flex w-full h-full">
          <TeamDisplay team={session.myTeam ?? null} />
        </div>
      </span>
      <span className="grid-span-1">
        <div className="absolute bottom-full right-0 flex w-fit h-1/3">
          <BanDisplay
            className="flex h-full bg-contain bg-no-repeat bg-clip-content aspect-square p-1.5 -m-1.5 mt-1.5"
            teamId={1}
            bans={session.theirTeamBans}
          />
        </div>
        <div className="flex justify-evenly h-full w-full">
          <TeamDisplay team={session.theirTeam ?? null} />
        </div>
      </span>
    </div>
  )
}
