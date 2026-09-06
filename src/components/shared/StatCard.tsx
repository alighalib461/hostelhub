import React from 'react'
import { cn } from '../../utils/cn'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  iconBg?: string
  iconColor?: string
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
  trend,
  className,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-md hover:border-slate-300',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight">{value}</p>
        </div>
        <div className={cn('p-3 rounded-2xl flex items-center justify-center shrink-0 border border-slate-100', iconBg, iconColor)}>
          {icon}
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                trend.isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <p className="text-xs text-[#64748B] font-medium">{subtitle}</p>}
        </div>
      )}
    </div>
  )
}
