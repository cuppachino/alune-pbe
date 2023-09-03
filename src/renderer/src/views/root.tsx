import { Outlet } from '@tanstack/react-router'
export default function RootView() {
  return (
    <div className="absolute inset-0 text-stone-950 dark:text-stone-100">
      <Outlet />
    </div>
  )
}
