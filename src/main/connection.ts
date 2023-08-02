import { auth as authenticate, HexgateError, Hexgate as HttpsClient, LcuClient } from 'hexgate'
import type { Credentials } from 'hexgate'
import { logger } from './logger'
import type { ConnectionStatus } from '@/types/connection-status'
import Observable from './observable'

export default class Connection {
  credentials: Credentials | null = null
  httpsClient: HttpsClient | null = null
  #wsClient: LcuClient | null = null
  constructor() {
    this.credentials = null
    this.httpsClient = null
    this.#wsClient = null
  }

  get lcuWsClient() {
    return this.#wsClient
  }

  status = new Observable<ConnectionStatus>('disconnected')

  update(credentials?: Credentials) {
    if (credentials) {
      this.status.value = 'connecting'
      this.credentials = credentials
      this.httpsClient = new HttpsClient(credentials)
      this.#heartbeat()
    } else {
      this.status.value = 'disconnected'
      this.credentials = null
      this.httpsClient = null
      this.#wsClient = null
    }
  }

  async connect() {
    try {
      const credentials = await retryUntilOk(authenticate)
      this.update(credentials)
    } catch (e) {
      logger.error(e)
    }
  }

  #heartbeatInterval: NodeJS.Timeout | null = null
  #heartbeat = () => {
    if (this.#heartbeatInterval) clearInterval(this.#heartbeatInterval)
    this.#heartbeatInterval = setInterval(async () => {
      try {
        const g = this.httpsClient!.build('/lol-summoner/v1/current-summoner')
          .method('get')
          .create()
        const res = await g({})
        if (res.ok) {
          if (this.status.value !== 'connected') {
            this.#wsClient = new LcuClient(this.credentials!)
            this.#initWebSocket()
          }
        } else {
          clearInterval(this.#heartbeatInterval!)
          this.update()
        }
      } catch (e) {
        clearInterval(this.#heartbeatInterval!)
        this.update()
      }
    }, 1000)
  }

  #initWebSocket = () => {
    if (!this.#wsClient) return
    this.#wsClient
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
