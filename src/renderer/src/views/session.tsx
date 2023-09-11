import { TeamDisplay } from '@renderer/components/TeamDisplay'
import { useChampSelectSession } from '@renderer/hooks/use-champ-select-session'
import { PreloadChampionSplashArt } from '@renderer/hooks/use-preload-images'

export default function ChampSelectView() {
  const session = useChampSelectSession()

  return (
    <>
      <PreloadChampionSplashArt hidden />
      <div className="absolute bottom-0 inset-x-0 min-h-[256px] w-full divide-x divide-white flex justify-evenly">
        <TeamDisplay team={session.myTeam ?? null} />
        <TeamDisplay team={session.theirTeam ?? null} />
      </div>
    </>
  )
}
