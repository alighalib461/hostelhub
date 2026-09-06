import React from 'react'
import { Button } from '../ui/Button'
import { cn } from '../../utils/cn'

export interface EmptyStateProps {
  title: string
  description: string
  icon: React.ReactNode
  actionLabel?: string
  actionIcon?: React.ReactNode
  onAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  actionIcon,
  onAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-brand flex items-center justify-center mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-bold text-text-primary tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-text-secondary max-w-sm mt-1.5 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} leftIcon={actionIcon} variant="primary" size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
