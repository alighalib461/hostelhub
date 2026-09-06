import React from 'react'
import { cn } from '../../utils/cn'

interface BrandLogoProps {
  variant?: 'full' | 'icon' | 'dark' | 'light' | 'monochrome'
  withTagline?: boolean
  className?: string
  iconSize?: number
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  withTagline = false,
  className,
  iconSize = 36,
}) => {
  const isDark = variant === 'dark'
  const isMonochrome = variant === 'monochrome'

  // Colors based on variant
  const houseColor = isMonochrome ? '#000000' : isDark ? '#3B82F6' : '#2563EB'
  const bedColor = isMonochrome ? '#000000' : '#16A085'
  const chimneyColor = isMonochrome ? '#000000' : isDark ? '#60A5FA' : '#1D4ED8'
  const textColor = isMonochrome ? 'text-black' : isDark ? 'text-white' : 'text-[#0D1B2A]'
  const hubColor = isMonochrome ? 'text-black' : isDark ? 'text-blue-400' : 'text-[#2563EB]'
  const taglineColor = isMonochrome ? 'text-slate-600' : isDark ? 'text-slate-300' : 'text-slate-500'

  const iconSvg = (
    <svg
      width={iconSize}
      height={iconSize}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 transition-transform duration-200"
    >
      {/* House roof and frame */}
      <path
        d="M40 8L6 35H15V70H65V35H74L40 8Z"
        stroke={houseColor}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chimney */}
      <path
        d="M58 22V14H66V28"
        stroke={chimneyColor}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Window panes */}
      <rect x="34" y="28" width="4" height="4" rx="1" fill={houseColor} />
      <rect x="42" y="28" width="4" height="4" rx="1" fill={houseColor} />
      <rect x="34" y="34" width="4" height="4" rx="1" fill={houseColor} />
      <rect x="42" y="34" width="4" height="4" rx="1" fill={houseColor} />

      {/* Bed frame & pillow in Teal */}
      <circle cx="28" cy="48" r="4" fill={bedColor} />
      <rect x="35" y="45" width="18" height="6" rx="3" fill={bedColor} />
      <rect x="23" y="54" width="34" height="5" rx="2.5" fill={isDark ? '#FFFFFF' : '#0D1B2A'} />
      {/* Bed legs */}
      <path
        d="M23 52V64M57 52V64"
        stroke={isDark ? '#FFFFFF' : '#0D1B2A'}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )

  if (variant === 'icon') {
    return <div className={cn('inline-flex items-center justify-center', className)}>{iconSvg}</div>
  }

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)}>
      {iconSvg}
      <div className="flex flex-col">
        <div className={cn('font-bold tracking-tight text-xl leading-none flex items-center', textColor)}>
          <span>Hostel</span>
          <span className={cn('font-extrabold ml-0.5', hubColor)}>HUB</span>
        </div>
        {withTagline && (
          <span className={cn('text-[10px] font-medium tracking-wider uppercase mt-1', taglineColor)}>
            Manage Better. Grow Faster.
          </span>
        )}
      </div>
    </div>
  )
}
