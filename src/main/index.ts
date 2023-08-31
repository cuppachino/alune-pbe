import { electronApp, is, optimizer } from '@electron-toolkit/utils'
import { BrowserWindow, app, shell } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { watchWindowBounds } from 'electron-bounds'

import { OperationResponses, type LcuComponents } from 'hexgate'
type LcuEventType = 'Create' | 'Update' | 'Delete'
type LolChampSelectChampSelectSession = LcuComponents['schemas']['LolChampSelectChampSelectSession']
let latestSession: LolChampSelectChampSelectSession | null = null
const handleChampSelect = ({ data }: { data: LolChampSelectChampSelectSession }) => {
  latestSession = data
  emit('champ-select', latestSession)
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const emit = (channel: string, ...args: any[]) =>
  BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, ...args))

import { logger } from './logger'
import { Connection } from 'hexgate'
import { updatedDiff } from 'deep-object-diff'

type ArrayItem<T extends any[]> = T[number]

export type ChampionMinimal = NonNullable<
  ArrayItem<OperationResponses<'GetLolChampionsV1OwnedChampionsMinimal'>>
>

let prevMyTeam: {
  cellIndex: number | undefined
  team: number | undefined
  championPickIntent: number | undefined
  championId: number
  championName: string
  img: string
}[] = []

type Team = Player[]

let myTeamplayerNames: string[] = []
const theirTeamplayerNames: string[] = []

class ChampSelect {
  private prevState: Omit<LolChampSelectChampSelectSession, 'timer'> = {}
  private myTeam: null | Team = null
  private theirTeam: null | Team = null

  private championLookup: Awaited<
    ReturnType<NonNullable<(typeof client)['recipe']>['roster']>
  > | null = null
  private nameLookup: Record<number, string> = {}

  constructor(public recipe: NonNullable<(typeof client)['recipe']>) {}

  async handleEventType(data: LolChampSelectChampSelectSession, eventType: LcuEventType) {
    if (eventType === 'Delete') {
      logger.info({ eventType }, 'event')
      prevMyTeam = []
      myTeamplayerNames = []
    }
    if (eventType === 'Create') {
      logger.info({ eventType }, 'event')
      this.nameLookup = Object.fromEntries(
        (
          await this.recipe.getSummonersById(
            [...data.myTeam!, ...data.theirTeam!].map((p) => p.summonerId).filter(Boolean)
          )
        ).data.map(({ displayName, summonerId }) => [summonerId, displayName])
      ) as Record<number, string>
    }
  }

  async mapTeam(team: LcuComponents['schemas']['LolChampSelectChampSelectPlayerSelection'][]) {
    if (this.championLookup === null) {
      this.championLookup = await this.recipe.roster()
    }

    return team.map((p): Player => {
      const champ = this.recipe.util.champById(p.championId ?? 0, this.championLookup!)
      const id = champ?.id ?? -1
      const noSelectionImg = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`
      const img = champ?.id
        ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${id}/${id}000.jpg`
        : noSelectionImg

      return {
        index: p.cellId!,
        championName: champ?.name ?? '',
        displayName: p.summonerId ? this.nameLookup[p.summonerId] : p.assignedPosition ?? 'TODO',
        img,
        teamId: p.team!
      }
    })
  }

  shouldUpdate = ({ timer, ...data }: LolChampSelectChampSelectSession) => {
    const diff = updatedDiff(this.prevState, data)
    const shouldUpdate = Object.keys(diff).length > 0
    if (shouldUpdate) logger.debug({ diff }, 'champ select session diff')
    return shouldUpdate
  }

  public handleChampSelect = async ({
    data,
    eventType
  }: {
    data: LolChampSelectChampSelectSession
    eventType: LcuEventType
  }) => {
    this.handleEventType(data, eventType)

    if (this.shouldUpdate(data)) {
      const myTeam = await this.mapTeam(data.myTeam ?? [])
      const theirTeam = await this.mapTeam(data.theirTeam ?? [])
      emit('champ-select', { myTeam, theirTeam })
      this.myTeam = myTeam
      this.theirTeam = theirTeam
    }
    this.prevState = data
  }
}

/// Client Connection
const client = new Connection({
  logger,
  createRecipe({ build, wrap, unwrap }) {
    const to = unwrap('should never error!')
    return {
      util: {
        filterOwned(champions: ChampionMinimal[]) {
          return champions.filter((c) => !!c.ownership?.owned)
        },
        champById(id: string | number, roster: ChampionMinimal[]) {
          return roster.find((c) => c.id === Number(id))
        }
      },
      roster: wrap(build('/lol-champions/v1/owned-champions-minimal').method('get').create())({
        to
      }),
      getCurrentSummoner: wrap(build('/lol-summoner/v1/current-summoner').method('get').create())({
        to
      }),
      getSummonersById: wrap(build('/lol-summoner/v2/summoner-names').method('get').create())({
        from(summonerIds: (string | number)[], init?) {
          return [
            {
              ids: JSON.stringify(summonerIds)
            },
            init
          ]
        }
      })
    }
  },
  interval: 2000,
  onStatusChange(status) {
    emit('status', status)
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

    // const champions = await con.recipe.roster()
    // const ownedChampion = con.recipe.util.filterOwned(champions)
    // con.logger.info(`Total champions: ${champions.length}. Owned: ${ownedChampion.length}`)

    // const handleChampSelect = async ({
    //   data,
    //   eventType
    // }: {
    //   data: LolChampSelectChampSelectSession
    //   eventType: LcuEventType
    // }) => {
    //   if (eventType === 'Delete') {
    //     con.logger.info({ eventType }, 'event')
    //     prevMyTeam = []
    //     myTeamplayerNames = []
    //   }
    //   if (eventType === 'Create') {
    //     const myTeam = await con.recipe.getSummonersById(
    //       data.myTeam!.map((p) => p.summonerId).filter(Boolean)
    //     )
    //     con.logger.info({ eventType, myTeam }, 'event')
    //   }
    //   // latestSession = data
    //   const myTeamChamps =
    //     data.myTeam?.map((p) => {
    //       const champ = con.recipe.util.champById(p.championId ?? 0, champions)
    //       const id = champ?.id ?? -1
    //       const noSelectionImg = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png`
    //       const img = champ?.id
    //         ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-splashes/${id}/${id}000.jpg`
    //         : noSelectionImg
    //       return {
    //         cellIndex: p.cellId,
    //         team: p.team,
    //         championPickIntent: p.championPickIntent,
    //         championId: p.championId || -1,
    //         championName: champ?.name ?? '',
    //         img,
    //         sum: p.summonerId
    //       }
    //     }) ?? []

    //   const diff = Object.entries(updatedDiff(prevMyTeam, myTeamChamps)).map(([_k, v]) => v)
    //   if (diff.length > 0) {
    //     emit('champ-select', myTeamChamps)
    //   }
    //   prevMyTeam = myTeamChamps
    // }

    const champSelect = new ChampSelect(con.recipe)
    con.ws.subscribe('OnJsonApiEvent_lol-champ-select_v1_session', champSelect.handleChampSelect)

    const summoners = await con.recipe.getSummonersById([summonerId!])
    con.logger.info(summoners, 'summoners from ids')
  },
  async onDisconnect(discon) {
    await sleep(2000)
    discon.connect()
  }
})

// /lol-game-data/assets/v1/champion-icons/777.png

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

  // Watch for window resize and save the bounds.
  watchWindowBounds(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Create a new view
  /* const view = new BrowserView()
  mainWindow.setBrowserView(view)
  view.setAutoResize({
    width: true,
    height: true
  }) */

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // view.webContents.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    // view.webContents.loadFile(join(__dirname, '../renderer/index.html'))
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

/// IPC
import { ipcMain } from 'electron'
import { Player } from '@/types/champion-select'

ipcMain.handle('get-status', () => {
  return client.status.value
})

ipcMain.handle('champ-select', () => {
  return prevMyTeam
})
