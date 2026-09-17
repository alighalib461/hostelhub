import React from 'react'
import { cn } from '../../utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
  progress?: number
  progressPercent?: number
  trend?: {
    value: string
    isPositive?: boolean
  }
  className?: string
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBg = 'bg-blue-50',
  iconColor = 'text-blue-brand',
  progress,
  progressPercent,
  trend,
  className,
  onClick,
}) => {
  const activeProgress = progressPercent !== undefined ? progressPercent : progress
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-card p-3.5 sm:p-5 transition-all duration-200 flex flex-col justify-between',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300 active:scale-[0.99]',
        className
      )}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0 flex-1">
            <p className="text-[10px] sm:text-xs font-bold text-[#64748B] uppercase tracking-wider truncate">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold text-[#172033] tracking-tight truncate">
              {value}
            </p>
          </div>
          <div
            className={cn(
              'p-2 sm:p-3 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 border border-slate-100/80',
              iconBg,
              iconColor
            )}
          >
            {icon}
          </div>
        </div>

        {activeProgress !== undefined && (
          <div className="w-full h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
            <div
              className="bg-blue-brand h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, activeProgress))}%` }}
            />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-2.5 flex items-center gap-1.5 pt-1.5 border-t border-slate-100/90 min-w-0">
          {trend && (
            <span
              className={cn(
                'text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                trend.isPositive
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-[#64748B] font-medium truncate">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

