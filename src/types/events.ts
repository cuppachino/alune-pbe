export interface EventMap {
  [event: string]: any[] | readonly any[]
}

export type EventPayload<T extends EventMap, K extends keyof T = keyof T> = {
  [K in keyof T]: T[K]
}[K]

export type ListenerFn<T extends any[] | readonly any[] = any[]> = (...payload: T) => void
