import { Outlet } from '@tanstack/react-router'

export default function NotFoundView() {
  return (
    <div className="border-red-500/25 border h-full">
      404 Not Found
      <Outlet />
    </div>
  )
}
