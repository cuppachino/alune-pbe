import pino from 'pino'

export const logger = pino({
  name: 'main' as const
})
