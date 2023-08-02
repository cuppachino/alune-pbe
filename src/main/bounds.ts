import { type BrowserWindow, screen } from 'electron'
import Store from 'electron-store'
import yaml from 'js-yaml'

type ReplaceReturn<T extends (...args: any[]) => unknown, U> = (...a: Parameters<T>) => U

type Bounds = {
  x: number
  y: number
  width: number
  height: number
}

const schema = {
  x: {
    type: 'number'
  },
  y: {
    type: 'number'
  },
  width: {
    type: 'number',
    minimum: 0,
    description: 'The width of the window.'
  },
  height: {
    type: 'number',
    minimum: 0
  }
} as const satisfies Store.Schema<Bounds>

const store = new Store<Bounds>({
  schema,
  fileExtension: 'yaml',
  serialize: yaml.dump,
  deserialize: yaml.load as ReplaceReturn<typeof yaml.load, Bounds>
})

/**
 * Get the window bounds from the store. Requires a window in case the store is empty.
 */
export function getWindowBounds(window: BrowserWindow): Bounds {
  if (!Object.keys(store.store).length) {
    saveWindowBounds(window)
  }
  return store.store
}

/**
 * Persist the bounds of a window in the store.
 * @param window The {@link BrowserWindow} to call `getBounds()` on.
 */
export function saveWindowBounds(window: BrowserWindow, silent = true): void {
  const bounds = window.getBounds()
  store.set(bounds)
  if (!silent) console.log('saveWindowBounds', bounds)
}

/**
 * Set a window's bounds to the bounds persisted in the store.
 * @param window The {@link BrowserWindow} to call `setBounds(...)` on.
 */
export function restoreWindowBounds(window: BrowserWindow): void {
  const bounds = store.store
  window.setBounds(bounds)
}

/**
 * Watch the window for changes in size and position and persist them in the store.
 * @param window The {@link BrowserWindow} to watch.
 */
export function watchWindowBounds(window: BrowserWindow, silent = true): void {
  // if the window is outside the screen, reset it to the default bounds
  if (isOffScreen(store.store)) {
    centerWindow(window)
  }

  window.setBounds(store.store)
  window.on('resized', () => saveWindowBounds(window, silent))
  window.on('moved', () => saveWindowBounds(window, silent))
}

/**
 * Get the path to the store file.
 */
export function getWindowStorePath(): string {
  return store.path
}

/**
 * Check if the bounds are outside the screen.
 * @param bounds The bounds to check.
 * @returns `true` if the bounds are outside the screen, `false` otherwise.
 */
export function isOffScreen({ x, y, width, height }: Bounds): boolean {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const isOutOfHorizontalBounds = x < 0 || x + width > screenWidth
  const isOutOfVerticalBounds = y < 0 || y + height > screenHeight

  return isOutOfHorizontalBounds || isOutOfVerticalBounds
}

/**
 * Center a window on the screen.
 * @param window The {@link BrowserWindow} to call `setBounds(...)` on.
 */
export function centerWindow(window: BrowserWindow): void {
  const { width, height } = window.getBounds()
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const x = Math.round((screenWidth - width) / 2)
  const y = Math.round((screenHeight - height) / 2)

  window.setBounds({ x, y, width, height })
  saveWindowBounds(window)
}
