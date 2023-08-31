import { Link, Outlet } from '@tanstack/react-router'

export default function RootView() {
  return (
    <>
      <div>
        <Link to="/">Home</Link>
      </div>
      <hr />
      <Outlet />
    </>
  )
}
