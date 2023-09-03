import pino from 'pino'

export const mainLogger = pino({
  name: 'main' as const
})

export const connectionLogger = mainLogger.child({
  name: 'connection' as const
})

export const champSelectLogger = mainLogger.child({
  name: 'champ-select' as const
})

export const httpsLogger = mainLogger.child({
  name: 'https-server' as const
})

export const wsLogger = mainLogger.child({
  name: 'ws-server' as const
})
