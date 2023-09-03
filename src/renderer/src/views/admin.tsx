import { assertElectron } from '@renderer/admin/assert-electron'
import { Outlet } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'

type AdminButtonProps = PropType<'button'>

function AdminButton({ children, className, ...props }: AdminButtonProps) {
  return (
    <button className={twMerge(`win-btn`, className)} {...props}>
      {children}
    </button>
  )
}

const postLobby = () => {
  assertElectron(window)
  window.electron.ipcRenderer.send('post-lobby')
}

export default function AdminView() {
  return (
    <div className="h-full p-5">
      <h1 className="text-3xl">Admin View</h1>
      <br />
      <AdminButton onClick={postLobby}>Post Lobby</AdminButton>
      <Outlet />
    </div>
  )
}
