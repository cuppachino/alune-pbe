import { auth as authenticate, HexgateError, Hexgate as HttpsClient, LcuClient } from 'hexgate'
import type { Credentials } from 'hexgate'
import { logger } from './logger'
import type { ConnectionStatus } from '@/types/connection-status'
import Observable from './observable'

export default class Connection {
  status = new Observable<ConnectionStatus>('disconnected')
  credentials: Credentials | null = null
  https: HttpsClient | null = null
  ws: LcuClient | null = null

  update(credentials?: Credentials) {
    if (credentials) {
      this.status.value = 'connecting'
      this.credentials = credentials
      this.https = new HttpsClient(credentials)
      this.#heartbeat()
    } else {
      this.status.value = 'disconnected'
      this.credentials = null
      this.https = null
      this.ws = null
    }
  }

  async connect() {
    try {
      const credentials = await retryUntilOk(() => authenticate())
      this.update(credentials)
    } catch (e) {
      logger.error(e)
    }
  }

  #heartbeatInterval: NodeJS.Timeout | null = null
  #heartbeatReset() {
    if (this.#heartbeatInterval) clearInterval(this.#heartbeatInterval)
  }
  #heartbeat() {
    this.#heartbeatReset()
    this.#heartbeatInterval = setInterval(async () => {
      try {
        const { ok } = await this.https!.build('/lol-summoner/v1/current-summoner')
          .method('get')
          .create()({})
        if (!ok) {
          this.#heartbeatReset()
          this.update()
        } else if (this.status.value !== 'connected') {
          this.ws = new LcuClient(this.credentials!)
          this.#initWebSocket()
        }
      } catch (e) {
        this.#heartbeatReset()
        this.update()
      }
    }, 1000)
  }

  #initWebSocket() {
    if (!this.ws) return
    this.ws
      .on('open', () => {
        this.status.value = 'connected'
        if (this.#heartbeatInterval) {
          clearInterval(this.#heartbeatInterval)
        }
      })
      .on('close', () => {
        this.update()
      })
  }

  #autoTimeout: NodeJS.Timeout | null = null
  /**
   * Delayed connection attempt. This will wait for the specified number of milliseconds before attempting to connect to the League Client.
   * @param ms The number of milliseconds to wait before attempting to reconnect.
   * @returns `this`
   */
  reconnect(ms = 2000) {
    this.#autoTimeout = setTimeout(() => {
      this.connect()
      clearTimeout(this.#autoTimeout!)
    }, ms)
    return this
  }

  #isOk(): this is Connection & {
    ws: NonNullable<Connection['ws']>
    https: NonNullable<Connection['https']>
  } {
    return !!this.ws && !!this.https && this.credentials !== null
  }
  /**
   * Check if the connection is ready to be used. This narrows the type of `this` to `Connection & { ws: LcuClient, https: HttpsClient }` using an "is" type predicate.
   * @returns `this` if the connection is ready to be used, otherwise `undefined`.
   * @example
   * if (client.ok()) {
   *   const unsub = client.ws.subscribe('OnJsonApiEvent_lol-champ-select_v1_session', handleChampSelect)
   * }
   * @example
   * currentSummoner = client.ok()?.https.build('/lol-summoner/v1/current-summoner').method('get').create()({})
   */
  ok() {
    if (this.#isOk()) {
      return this
    }
    return undefined
  }
}

const pollbot = logger.child({ name: 'pollbot' })

async function retryUntilOk<T>(fn: () => Promise<T>, ms = 2500): Promise<T> {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof HexgateError) {
      pollbot.trace(e)
      e.kind === 'missing' && pollbot.debug('Polling for a League of Legends client')
    } else {
      pollbot.error(e)
    }
    return await new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(retryUntilOk(fn))
      }, ms)
    })
  }
}
