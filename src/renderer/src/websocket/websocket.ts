import { EventMap, EventPayload, ListenerFn } from '@/types/events'

export default class CustomWebSocket<T extends EventMap> extends WebSocket {
  private listeners = new Map<keyof T, Set<ListenerFn<EventPayload<T>>>>()

  constructor(port: number) {
    super(`ws://localhost:${port}`)

    this.addEventListener('message', (ev) => {
      try {
        const [event, ...data] = JSON.parse(ev.data) as [
          keyof T & string,
          ...EventPayload<T, keyof T>
        ]
        const listeners = this.listeners.get(event)
        if (!listeners) {
          console.warn(`No listeners for event "${event}"`)
          return
        }
        listeners.forEach((listener) => listener(...data))
      } catch (err) {
        console.log('message', ev.data)
        console.error(err)
      }
    })
  }

  getListeners(event: keyof T) {
    const listeners = this.listeners.get(event)
    if (!listeners) {
      this.listeners.set(event, new Set())
    }
    return this.listeners.get(event)!
  }

  on<K extends keyof T>(event: K, listener: ListenerFn<EventPayload<T, K>>) {
    const listeners = this.getListeners(event)
    listeners.add(listener as ListenerFn<EventPayload<T>>)
    this.listeners.set(event, listeners)
    return () => this.off(event, listener)
  }

  off<K extends keyof T>(event: K, listener: ListenerFn<EventPayload<T, K>>) {
    const listeners = this.getListeners(event)
    listeners.delete(listener as ListenerFn<EventPayload<T>>)
    this.listeners.set(event, listeners)
  }

  sendMessage(message: keyof T) {
    if (this.readyState === this.OPEN) {
      this.send(JSON.stringify([message]))
      return
    }

    function onOpen(this: CustomWebSocket<T>) {
      this.send(JSON.stringify([message]))
      this.removeEventListener('open', onOpen)
    }

    this.addEventListener('open', onOpen)
  }
}
