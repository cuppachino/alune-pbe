import { champSelectLogger, connectionLogger, httpsLogger, mainLogger, wsLogger } from './logger'
import { electronApp, is, optimizer, platform } from '@electron-toolkit/utils'
import { BrowserWindow, app, nativeImage, shell } from 'electron'
import { join } from 'path'

const emit = (channel: string, ...args: any[]) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, ...args))

/// Https Server
import express from 'express'
const expressApp = express()
const HTTPS_PORT = Number(process.env['MAIN_VITE_HTTPS_PORT'] || 4103)
expressApp.use(express.static(join(__dirname, '../renderer')))
expressApp.get('*', (_req, res) => {
  res.sendFile(join(__dirname, '../renderer/index.html'))
})
expressApp.listen(HTTPS_PORT, () => {
  httpsLogger.info(HTTPS_PORT, `listening on env ws port.`)
})

import { LobbyState } from './lobby-state'
const lobbyState = new LobbyState({
  onUpdate(_self, state) {
    wss.clients.forEach((c) =>
      c.send(
        JSON.stringify([
          'lobby-state',
          {
            ...state,
            inChampSelect: champSelect.inChampSelect
          }
        ])
      )
    )
  }
})

// WebSocket Server
import { WebSocketServer } from 'ws'
const WEBSOCKET_PORT = Number(process.env['MAIN_VITE_WS_PORT'] || 4104)
const wss = new WebSocketServer({ port: WEBSOCKET_PORT })
wsLogger.info(WEBSOCKET_PORT, 'listening on env ws port.')
wss.on('connection', function connection(ws) {
  wsLogger.debug('a user connected')
  ws.on('error', wsLogger.error)
  ws.on('message', function message(data) {
    try {
      const [msg] = JSON.parse(data.toString()) as [keyof AluneEventMap]
      wsLogger.debug(msg, 'recieved message')
      switch (msg) {
        case 'get-status':
          ws.send(JSON.stringify(['get-status', client.status.value]))
          break
        case 'champ-select':
          ws.send(
            JSON.stringify(['champ-select', champSelect.current ?? { myTeam: [], theirTeam: [] }])
          )
          break
        case 'preload-images':
          poll(
            async () => {
              ws.send(JSON.stringify(['preload-images', championLookup.images()]))
              return true
            },
            1000,
            10
          )
          break
        case 'lobby-state':
          ws.send(
            JSON.stringify([
              'lobby-state',
              {
                ...lobbyState.data,
                inChampSelect: champSelect.inChampSelect
              }
            ])
          )
      }
    } catch (err) {
      wsLogger.error(err)
    }
  })

  ws.send(JSON.stringify(['get-status', client.status.value]))
})

/// Champion Lookup
import { ChampionLookup } from './champion-lookup'
const championLookup = new ChampionLookup()

/// Champion Select Session
import { ChampionSelect } from './champion-select'
const champSelect = new ChampionSelect({
  logger: champSelectLogger,
  championLookup,
  onUpdate: (session) => {
    champSelect.logger.info(session.myTeam, 'champ select session updated')
    wss.clients.forEach((client) => client.send(JSON.stringify(['champ-select', session])))
  }
})

/// Client Connection
import { Connection, poll, type LobbyMatchmakingSearchState } from 'hexgate'
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const client = new Connection({
  logger: connectionLogger,
  createRecipe({ build, wrap, to, unwrap }) {
    return {
      getCurrentSummoner: unwrap(build('/lol-summoner/v1/current-summoner').method('get').create()),
      getSummonersById: wrap(build('/lol-summoner/v2/summoner-names').method('get').create())({
        from(summonerIds: (string | number)[]) {
          return [
            {
              ids: JSON.stringify(summonerIds)
            }
          ]
        },
        to
      }),
      postLobby: wrap(build('/lol-lobby/v2/lobby').method('post').create())({
        from(config: LobbyConfig) {
          // todo !!
          return [config]
        }
      }),
      cancelLobby: build('/lol-lobby/v2/lobby').method('delete').create(),
      startGame: build('/lol-lobby/v2/lobby/matchmaking/search').method('post').create(),
      startCustomGame: build('/lol-lobby/v1/lobby/custom/start-champ-select')
        .method('post')
        .create()
    }
  },
  interval: 2000,
  async onStatusChange(status) {
    await lobbyState.update(client.https)
    await championLookup.update(client.https)
    emit('status', status)
    wss.clients.forEach((c) => c.send(JSON.stringify(['get-status', client.status.value])))
    client.logger.info({ status }, 'client status changed')
  },
  async onConnect(con) {
    const { displayName, summonerId, accountId, puuid } = await con.recipe.getCurrentSummoner()
    con.logger.info(
      {
        accountId,
        puuid,
        summonerId
      },
      `Welcome, ${displayName}`
    )

    const summoners = await con.recipe.getSummonersById([summonerId!])
    con.logger.info(summoners, 'summoners from ids')

    await championLookup.update(client.https)
    con.logger.info(championLookup.championById(1), 'champion by id 1')

    con.ws.subscribe('OnJsonApiEvent_lol-lobby_v2_lobby', lobbyState.handleLobbyEvent)

    await champSelect.update(con.https)
    con.ws.subscribe('OnJsonApiEvent_lol-champ-select_v1_session', champSelect.handleChampSelect)
  },
  async onDisconnect(discon) {
    await champSelect.update(null)
    await sleep(2000)
    discon.connect()
  }
})

client.connect()

/// Electron
const TITLE_BAR_HEIGHT = 32

import { AluneEventMap } from '@/types/alune-events'
import { MicaBrowserWindow } from 'mica-electron'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new MicaBrowserWindow({
    width: 1280,
    height: 720 + TITLE_BAR_HEIGHT,
    show: false,
    transparent: true,
    minWidth: 460,
    minHeight: 460,
    // backgroundColor: '#20202000',
    // frame: false,
    autoHideMenuBar: true,
    // backgroundMaterial: 'mica',
    title: 'Alune',
    icon: nativeImage.createFromPath(join(__dirname, '../../resources/icon.png')),
    // titleBarStyle: platform.isWindows ? 'hidden' : 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // Watch for window resize and save the bounds.
  mainWindow.on('ready-to-show', () => {
    if (platform.isWindows) {
      mainWindow.setDarkTheme()
      mainWindow.setMicaEffect()
    }

    // watchWindowBounds(mainWindow)

    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    const { url } = details
    if (url.endsWith('/web')) {
      console.warn(details, "opening a new window ending with '/web'")
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/admin')
    // view.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadURL(`http://localhost:${HTTPS_PORT}`)
    // mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    // view.webContents.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // redirect to the admin page
  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.webContents.send('redirect', '/admin')
  })
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

/// IPC
import { ipcMain } from 'electron'
import { LobbyConfig, LobbyKind, lobbyConfig } from './lobby-config'

const cycleBrowserWindowSize = () => {
  let i = 0
  const sizes = [
    { width: 1280, height: 720 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1440 }
  ]
  return () => {
    const { width, height } = sizes[i++ % sizes.length]!
    BrowserWindow.getAllWindows().forEach((w) => {
      w.setSize(width, height)
      w.center()
    })
  }
}

const cycle = cycleBrowserWindowSize()

ipcMain.on('cycle-window', cycle)

ipcMain.on('post-lobby', async (_, lobbyKind: LobbyKind | 'cancel') => {
  if (lobbyKind === 'cancel') {
    const res = await client.ok()?.recipe.cancelLobby()
    mainLogger.debug(res?.status, 'cancel-lobby')
    return
  }
  if (lobbyKind in lobbyConfig) {
    const res = await client.ok()?.recipe.postLobby(lobbyConfig[lobbyKind])
    mainLogger.debug(res?.status, 'post-lobby')
  } else {
    mainLogger.error(lobbyKind, 'invalid lobby kind')
  }
})

ipcMain.on('start-game', async (_, lobbyKind: LobbyKind) => {
  console.log('start game', lobbyKind)
  let res
  if (lobbyKind === 'practiceTool') {
    res = await client.ok()?.recipe.startCustomGame()
  } else {
    res = await client.ok()?.recipe.startGame()
  }
  console.log(res)
  mainLogger.debug(res, 'start-game')
})

ipcMain.on('preload-images', () => {
  const images = championLookup.images()
  mainLogger.debug(images, 'preload images')
  wss.clients.forEach((c) => c.send(JSON.stringify(['preload-images', images])))
})
