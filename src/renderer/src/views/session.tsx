import { TeamDisplay } from '@renderer/components/TeamDisplay'
import { useChampSelectSession } from '@renderer/hooks/use-champ-select-session'

export default function ChampSelectView() {
  const session = useChampSelectSession()
  return (
    <div className="absolute bottom-0 inset-x-0 min-h-[280px] w-full divide-x divide-white flex justify-evenly">
      <TeamDisplay team={session.myTeam ?? null} />
      <TeamDisplay team={session.theirTeam ?? null} />
    </div>
  )
}

// <div className="text-white">
//   <pre>{JSON.stringify(session, null, 2)}</pre>
// </div>
