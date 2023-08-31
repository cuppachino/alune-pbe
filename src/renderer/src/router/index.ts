import { RootRoute, Route, Router } from '@tanstack/react-router'
import RootView from '@renderer/views/root'
import App from '@renderer/App'

const rootRoute = new RootRoute({
  component: RootView
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App
})

const routeTree = rootRoute.addChildren([indexRoute])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
