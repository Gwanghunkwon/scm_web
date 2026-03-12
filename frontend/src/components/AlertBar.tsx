import type { ReactNode } from 'react'

type AlertBarProps = {
  type?: 'info' | 'error'
  children: ReactNode
}

export function AlertBar({ type = 'info', children }: AlertBarProps) {
  if (!children) return null

  const variantClass = type === 'error' ? 'global-message-error' : 'global-message-info'

  return <div className={`global-message ${variantClass}`}>{children}</div>
}

