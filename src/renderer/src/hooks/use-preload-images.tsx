import { useWebSocket } from '@renderer/websocket'

/**
 * @platform `web` | `electron`
 */
export function PreloadChampionSplashArt(props: PropType<'img'>) {
  const lookup = useWebSocket('preload-images', {})
  return Object.entries(lookup).map(([id, url]) => (
    <img {...props} key={`preload-splash-${id}`} src={url} />
  ))
}
