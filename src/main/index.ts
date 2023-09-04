import { champSelectLogger, connectionLogger, httpsLogger, wsLogger } from './logger'
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
  onUpdate(session) {
    wss.clients.forEach((client) => client.send(JSON.stringify(['champ-select', session])))
  }
})

/// Client Connection
import { Connection } from 'hexgate'
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
        from() {
          // todo !!
          return [
            {
              queueId: 400
            }
          ]
        }
      })
    }
  },
  interval: 2000,
  onStatusChange(status) {
    champSelect.update(client.https)
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

    con.ws.subscribe('OnJsonApiEvent_lol-champ-select_v1_session', champSelect.handleChampSelect)

    const summoners = await con.recipe.getSummonersById([summonerId!])
    con.logger.info(summoners, 'summoners from ids')

    await championLookup.update(con.https)
    con.logger.info(championLookup.ok()?.championById(1), 'champion by id 1')
  },
  async onDisconnect(discon) {
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

ipcMain.on('post-lobby', () => {
  client.ok()?.recipe.postLobby()
})
