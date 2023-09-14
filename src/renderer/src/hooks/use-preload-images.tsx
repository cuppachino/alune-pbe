import { useWebSocket } from '@renderer/websocket'

/**
 * @platform `web` | `electron`
 */
export function PreloadChampionSplashArt(props: PropType<'span'>) {
  const lookup = useWebSocket('preload-images', {})
  return Object.entries(lookup).map(([id, { splash: url, square: banUrl }]) => (
    <span {...props} key={`preload-images-${id}`}>
      <img hidden src={url} />
      <img hidden src={banUrl} />
    </span>
  ))
}
