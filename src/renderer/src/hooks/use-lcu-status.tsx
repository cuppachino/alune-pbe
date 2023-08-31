import { useEffect, useState } from 'react'
import type { ConnectionStatus } from '@/types/connection-status'

/**
 * Hook to get the current LCU connection status.
 *
 * @platform `electron`
 */
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
