import React from 'react'
import { STATUS_CONFIG } from '../../constants/status'
import { cn } from '../../utils/cn'

export interface StatusBadgeProps {
  status: string | null | undefined
  className?: string
  showDot?: boolean
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showDot = true }) => {
  if (!status) return null

  const key = status.toLowerCase() as keyof typeof STATUS_CONFIG
  const config = STATUS_CONFIG[key] || {
    label: status.charAt(0).toUpperCase() + status.slice(1),
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200/80',
    dotClass: 'bg-slate-400',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        config.badgeClass,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotClass)} />}
      <span>{config.label}</span>
    </span>
  )
}
