import { MakeLinkPropsOptions, Link as RouterLink } from '@tanstack/react-router'
import { PropsWithChildren } from 'react'
import { twMerge } from 'tailwind-merge'

export type LinkProps = PropsWithChildren<MakeLinkPropsOptions & { external?: true }>

export function Link({ to, children, className, external, ...props }: LinkProps) {
  return (
    <RouterLink
      {...(external ? { target: '_blank' } : {})}
      activeProps={{
        className: 'nav-btn-active'
      }}
      inactiveProps={{
        className: 'hover:nav-btn-active text-white/75'
      }}
      className={twMerge('nav-btn transition-all duration-150', className)}
      to={to}
      tabIndex={-1}
      onFocus={(e) => {
        e.preventDefault()
        e.currentTarget.blur()
      }}
      {...props}
    >
      {children}
    </RouterLink>
  )
}
