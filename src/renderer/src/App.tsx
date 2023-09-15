import { useLcuStatus } from '@renderer/hooks/use-lcu-status'

export function StatusBar({ children }: React.PropsWithChildren<{}>) {
  const status = useLcuStatus()
  return (
    <footer className="bg-stone-100 dark:bg-stone-950/50 text-stone-950 dark:text-stone-100 text-sm px-2 p-0.5 inline-flex gap-4 items-center justify-between overflow-clip">
      <div>
        <span>{status}</span>
      </div>
      <div>{children}</div>
    </footer>
  )
}

import { Outlet } from '@tanstack/react-router'
import { TitleBar } from '@renderer/components/TitleBar'
import { PreloadChampionSplashArt } from './hooks/use-preload-images'

function App(): JSX.Element {
  return (
    <div className="flex flex-col relative max-h-full h-full font-sans overflow-clip">
      <TitleBar />
      <div className="relative h-full">
        <Outlet />
      </div>
      <StatusBar />
      <PreloadChampionSplashArt hidden />
    </div>
  )
}

export default App
