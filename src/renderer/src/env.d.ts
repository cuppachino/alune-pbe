/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly RENDERER_VITE_HTTPS_PORT: number
  readonly RENDERER_VITE_WS_PORT: number
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

type PropType<T extends React.ElementType<any>> = React.ComponentPropsWithoutRef<T>

type ClassName<T = Element> = React.HTMLAttributes<T>['className']
