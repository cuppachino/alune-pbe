import { useEffect, useState } from 'react'
import type { ConnectionStatus } from '@/types/connection-status'

export function useLcuStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  useEffect(() => {
    window.electron.ipcRenderer.invoke('get-status').then((status: ConnectionStatus) => {
      setStatus(status)
    })
  }, [])

  useEffect(() => {
    const handleStatusChange = (_: any, status: ConnectionStatus) => {
      setStatus(status)
    }

    const cleanup = window.electron.ipcRenderer.on('status', handleStatusChange)

    return () => {
      cleanup()
    }
  }, [])

  return status
}

function App(): JSX.Element {
  const status = useLcuStatus()

  return (
    <div className="font-inter">
      <div className="bg-stone-100 p-5">{status}</div>
    </div>
  )
}

export default App
