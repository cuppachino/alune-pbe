import { AluneEventMap } from '@/types/alune-events'
import AluneWebSocket from './websocket'
import { createWebSocketHook } from './create-hook'

export const ws = new AluneWebSocket<AluneEventMap>(import.meta.env.RENDERER_VITE_WS_PORT)

export const send = ws.sendMessage.bind(ws)

export const useWebSocket = createWebSocketHook(ws)
