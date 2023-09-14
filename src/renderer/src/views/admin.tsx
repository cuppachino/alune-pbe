import { assertElectron } from '@renderer/admin/assert-electron'
import { Button } from '@renderer/components/Button'
import { Outlet } from '@tanstack/react-router'
import { useLobbyState } from '@renderer/hooks/use-lobby-state'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

type LobbyKind = 'practiceTool'

const postLobby = (kind: LobbyKind) => {
  assertElectron(window)
  window.electron.ipcRenderer.send('post-lobby', kind)
}
const cycleWindow = () => {
  assertElectron(window)
  window.electron.ipcRenderer.send('cycle-window')
}

const startGame = (kind: LobbyKind) => {
  assertElectron(window)
  window.electron.ipcRenderer.send('start-game', kind)
}

function Panel({
  title,
  children,
  className,
  ...props
}: React.PropsWithChildren<PropType<'div'> & { title: string }>) {
  return (
    <div className={twMerge('flex flex-col gap-4', className)} {...props}>
      <h3 className="capitalize">{title}</h3>
      {children}
    </div>
  )
}

function LobbyControls({
  searchState,
  canStartActivity
}: {
  searchState: ReturnType<typeof useLobbyState>['searchState']
  canStartActivity: boolean
}) {
  const [lobbyKind, setLobbyKind] = useState<LobbyKind>('practiceTool')

  return (
    <Panel title={'lobby'} className="w-full">
      {searchState === 'Invalid' && (
        <>
          <Button className="shadow-md w-full" onClick={() => postLobby(lobbyKind)}>
            Post Lobby
          </Button>
          <select
            className="block shadow-md win-btn"
            value={lobbyKind}
            onChange={(e) => setLobbyKind(e.target.value as LobbyKind)}
          >
            <option value="practiceTool">Practice Tool</option>
            <option value="rankedSolo5v5">Ranked Solo 5v5</option>
          </select>
        </>
      )}
      {canStartActivity && (
        <Button className="shadow-md" onClick={() => startGame(lobbyKind)}>
          Start Game
        </Button>
      )}
    </Panel>
  )
}

function LobbyController() {
  const { inChampSelect, canStartActivity, searchState } = useLobbyState()

  return (
    <div>
      <div className="flex gap-4">
        {!inChampSelect && (
          <LobbyControls searchState={searchState} canStartActivity={canStartActivity} />
        )}
      </div>
    </div>
  )
}

function RecordingController() {
  const [record, setRecording] = useState(false)
  const toggle = () => {
    setRecording((prev) => {
      assertElectron(window)
      window.electron.ipcRenderer.send('recording-controller', prev ? 'disable' : 'enable')
      return !prev
    })
  }

  return (
    <Panel title={'recording'} className="flex">
      <Button className="shadow-md" onClick={toggle}>
        {record ? 'Stop Recording' : 'Start Recording'}
      </Button>
      <Button
        className="shadow-md"
        onClick={() => {
          assertElectron(window)
          window.electron.ipcRenderer.send('recording-controller', 'save')
        }}
      >
        Save
      </Button>
      <Button
        className="shadow-md"
        onClick={() => {
          assertElectron(window)
          window.electron.ipcRenderer.send('recording-controller', 'clear')
        }}
      >
        Clear
      </Button>
    </Panel>
  )
}

export default function AdminView() {
  return (
    <div className="h-full px-10 py-5">
      <h2>Admin View</h2>
      <br />
      <div className="grid grid-flow-col items-start grid-cols-3 gap-10">
        <div className="grid gap-10 col-span-1">
          <RecordingController />
          <LobbyController />
        </div>
        <Panel title={'window'} className="col-span-2">
          <Button className="shadow-md" onClick={cycleWindow}>
            Cycle Window
          </Button>
        </Panel>
      </div>
      <Outlet />
    </div>
  )
}
