type NonNullableInner<T> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

/**
 * Asserts that the Electron API is available.
 */
export function assertElectron(
  _?: Window & typeof globalThis
): asserts _ is NonNullableInner<Window> & typeof globalThis {
  if (!('electron' in window)) {
    throw new Error('The Electron API is not available for this browser window!')
  }
}
