import { assertElectron } from '@renderer/admin/assert-electron'
import { Button } from '@renderer/components/Button'
import { Outlet } from '@tanstack/react-router'
import { useLobbyState } from '@renderer/hooks/use-lobby-state'
import { useCallback, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import { useRecordingSize } from '@renderer/hooks/use-recording-size'

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

function RecordingBufferBar() {
  const size = useRecordingSize()
  return (
    <div className="w-full h-1 bg-gray-400">
      <div className="h-full bg-green-400" style={{ width: `${size}%` }} />
    </div>
  )
}

function RecordingController() {
  const [isRecording, setIsRecording] = useState(false)

  const toggle = useCallback(async () => {
    assertElectron(window)
    const res: boolean = await window.electron.ipcRenderer.invoke(
      'recording-controller',
      isRecording ? 'disable' : 'enable'
    )
    setIsRecording(res)
  }, [isRecording])

  const clear = async () => {
    assertElectron(window)
    const res = await window.electron.ipcRenderer.invoke('recording-controller', 'clear')
    setIsRecording(res)
  }

  return (
    <Panel title={'recording'} className="flex">
      {!!isRecording && <RecordingBufferBar />}
      <Button className="shadow-md" onClick={toggle}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </Button>
      <Button
        className="shadow-md"
        onClick={() => {
          assertElectron(window)
          window.electron.ipcRenderer.invoke('recording-controller', 'save')
        }}
      >
        Save
      </Button>
      <Button className="shadow-md" onClick={clear}>
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
