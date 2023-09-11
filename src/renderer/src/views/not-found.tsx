import { LinkButton } from '@renderer/components/LinkButton'
import { Outlet } from '@tanstack/react-router'

export default function NotFoundView() {
  return (
    <div className="h-full p-5 gap-10 flex flex-col items-center justify-center -translate-y-10 overflow-clip">
      <h1>404 Not Found</h1>
      <LinkButton to="/admin">Back to admin panel</LinkButton>
      <Outlet />
    </div>
  )
}
