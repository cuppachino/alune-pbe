import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { watchWindowBounds } from './bounds'
import Client from './connection'
import { logger } from './logger'

const emit = (channel: string, ...args: any[]) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, ...args))

const client = new Client()
const reconnect = () => {
  const timeout = setTimeout(() => {
    client.connect()
    clearTimeout(timeout)
  }, 2000)
}

client.status.subscribe((status, prev) => {
  logger.info(`LCU status: ${status}`)
  emit('status', status)

  if (status === 'connected' && prev !== 'connected') {
    client.lcuWsClient?.on('error', (err) => {
      console.log(err)
    })
  }

  if (status === 'disconnected' && prev !== 'disconnected') {
    reconnect()
  }
})

client.connect()

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  watchWindowBounds(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
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

// Handle IPC

import { ipcMain } from 'electron'

ipcMain.handle('get-status', () => {
  return client.status.value
})
