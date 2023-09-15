import { BanDisplay } from '@renderer/components/BanDisplay'
import { TeamDisplay } from '@renderer/components/TeamDisplay'
import { useChampSelectSession } from '@renderer/hooks/use-champ-select-session'

function NullBan() {
  return (
    <svg className="absolute w-full h-full p-2" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path d="M0 100 L100 0" stroke="white" strokeWidth="1" />
    </svg>
  )
}
export default function ChampSelectView() {
  const session = useChampSelectSession()

  return (
    <div className="absolute bottom-0 inset-x-0 min-h-[30%] w-full flex">
      <span className="relative flex w-full">
        <div className="absolute bottom-full left-0 flex w-fit h-[30%] xl:h-1/3">
          <BanDisplay
            className="flex h-full outline outline-1"
            classNamePicking="outline-blue-500"
            classNameNotPicking="outline-transparent"
            teamId={0}
            bans={session.myTeamBans}
            banSize={session.banSize && session.banSize / 2}
          >
            <NullBan />
          </BanDisplay>
        </div>
        <div className="flex w-full h-full">
          <TeamDisplay team={session.myTeam ?? null} />
        </div>
      </span>
      <div className="flex border justify-center items-center w-fit p-10">
        {/* {session.banSize ?? 'none'} */}
        {session.phase ?? 'none'}
      </div>
      <span className="relative flex w-full">
        <div className="absolute bottom-full right-0 flex w-fit h-1/3">
          <BanDisplay
            className="flex h-full outline outline-1"
            classNamePicking="outline-red-500"
            classNameNotPicking="outline-transparent"
            teamId={1}
            bans={session.theirTeamBans}
            banSize={session.banSize && session.banSize / 2}
          >
            <NullBan />
          </BanDisplay>
        </div>
        <div className="flex justify-evenly h-full w-full">
          <TeamDisplay team={session.theirTeam ?? null} />
        </div>
      </span>
    </div>
  )
}
