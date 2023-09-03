export interface EventMap {
  [event: string]: any[]
}

export type EventPayload<T extends EventMap, K extends keyof T = keyof T> = {
  [K in keyof T]: T[K]
}[K]

export type ListenerFn<T extends any[] = any[]> = (...payload: T) => void
