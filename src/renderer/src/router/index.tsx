import { RootRoute, Route, Router } from '@tanstack/react-router'
import RootView from '@renderer/views/root'
import App from '@renderer/App'
import WebView from '@renderer/views/web'
import SessionView from '@renderer/views/session'
import AdminView from '@renderer/views/admin'
import NotFoundView from '@renderer/views/not-found'

const rootRoute = new RootRoute({
  component: RootView
})

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App
})

const webRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/web',
  component: WebView
})

const adminRoute = new Route({
  getParentRoute: () => indexRoute,
  path: '/admin',
  component: AdminView
})

const sessionRoute = new Route({
  getParentRoute: () => indexRoute,
  path: '/session',
  component: SessionView
})

const notFoundRoute = new Route({
  getParentRoute: () => indexRoute,
  path: '*',
  component: NotFoundView
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  webRoute,
  adminRoute,
  sessionRoute,
  notFoundRoute
])

export const router = new Router({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
