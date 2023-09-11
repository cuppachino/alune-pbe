import { Link as RouterLink } from '@tanstack/react-router'
import { twMerge } from 'tailwind-merge'
import type { LinkProps } from './Link'

export function LinkButton({ to, children, className, external, ...props }: LinkProps) {
  return (
    <RouterLink to="/admin" className={twMerge(`win-btn`, className)} {...props}>
      {children}
    </RouterLink>
  )
}
