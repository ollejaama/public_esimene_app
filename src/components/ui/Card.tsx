import { HTMLAttributes } from 'react'
import { clsx } from 'clsx'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={clsx('bg-white border border-[#e5e5e5] rounded-lg', className)}
    >
      {children}
    </div>
  )
}
