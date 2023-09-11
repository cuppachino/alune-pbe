import { twMerge } from 'tailwind-merge'

export type ButtonProps = PropType<'button'>

export function Button({ children, className, ...props }: ButtonProps) {
  return (
    <button className={twMerge(`win-btn`, className)} {...props}>
      {children}
    </button>
  )
}
