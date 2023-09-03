import { useLcuStatus } from '@renderer/hooks/use-lcu-status'
import SessionView from './session'

export default function WebView() {
  const clientStatus = useLcuStatus()

  return (
    <div className="absolute inset-0 bg-black">
      <div className="bg-stone-100 text-stone-950 text-lg p-2 flex justify-between">
        <h1>WebView</h1>
        <div>lcu: {clientStatus}</div>
      </div>

      <SessionView />
    </div>
  )
}
