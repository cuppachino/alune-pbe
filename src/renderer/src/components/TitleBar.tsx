import { Link } from '@renderer/components/Link'
import { twMerge } from 'tailwind-merge'

export function TitleBar({
  className,
  ...props
}: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) {
  return (
    <div {...props} className={twMerge('p-2 inline-flex gap-3 justify-between', className)}>
      <span className="inline-flex gap-3">
        <Link className="min-w-[7rem]" to="/admin">
          Admin
        </Link>
        <Link className="min-w-[7rem]" to="/session">
          Session
        </Link>
      </span>
      <span className="inline-flex gap-3">
        <Link
          className="min-w-[7rem]"
          //@ts-expect-error todo!
          to="/settings"
        >
          Settings
        </Link>
        <Link external to="/web">
          Web
        </Link>
      </span>
    </div>
  )
}
