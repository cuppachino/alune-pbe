import { Player } from '@/types/champion-select'
import { useLcuStatus } from '@renderer/hooks/use-lcu-status'
import { useState, useEffect, useRef } from 'react'

type Sesh = {
  myTeam: Player[] | null
  theirTeam: Player[] | null
}

/**
 *
 *
 * @platform `electron`
 */
export function useSession() {
  const [session, setSession] = useState<Sesh | null>(null)

  // const ref = useRef(false)

  useEffect(() => {
    window.electron.ipcRenderer.invoke('champ-select').then(setSession)
  }, [])

  useEffect(() => {
    const handleSessionChange = (_: any, session: Sesh) => {
      console.log('session change', session)
      setSession(session)
    }

    return window.electron.ipcRenderer.on('champ-select', handleSessionChange)
  }, [])

  return session
}

function TeamDisplay({ team }: { team: Player[] | null }) {
  const players = team?.length ?? 0

  return (
    <div className="grid grid-flow-col grid-fr">
      {team?.map((p) => {
        return (
          <div
            className="bg-center bg-cover"
            style={{
              backgroundImage: `url(${p.img})`
            }}
            key={`team-${p.teamId}-cell-${p.index}`}
          >
            <span className="w-10 overflow-ellipsis">{p.championName}</span>
          </div>
        )
      })}
    </div>
  )
}

function App(): JSX.Element {
  const status = useLcuStatus()
  const session = useSession()

  return (
    <div className="font-inter">
      <div className="bg-stone-100 text-stone-950 p-5">{status}</div>
      <div className="absolute bottom-0 grid grid-flow-col grid-cols-2 min-h-[280px] w-full divide-x divide-white">
        <TeamDisplay team={session?.myTeam ?? null} />
        <TeamDisplay team={session?.theirTeam ?? null} />
      </div>
      <div className="text-white">
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  )
}

export default App
