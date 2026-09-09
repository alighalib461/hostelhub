import React from 'react'
import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'teal' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]'

    const variants = {
      primary: 'bg-[#2563EB] text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
      secondary: 'bg-[#0D1B2A] text-white hover:bg-[#070D14] focus:ring-slate-900 shadow-sm',
      teal: 'bg-[#16A085] text-white hover:bg-teal-700 focus:ring-teal-500 shadow-sm',
      success: 'bg-[#2ECC71] text-white hover:bg-emerald-600 focus:ring-emerald-500 shadow-sm',
      danger: 'bg-[#E74C3C] text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm',
      outline: 'border border-slate-300 bg-white text-[#172033] hover:bg-slate-50 hover:border-slate-400 focus:ring-blue-500 shadow-2xs',
      ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-[#172033] focus:ring-slate-400',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-8 h-auto',
      md: 'text-sm px-4 py-2 gap-2 min-h-10 h-auto',
      lg: 'text-base px-5 py-2.5 gap-2.5 min-h-12 h-auto',
      icon: 'h-10 w-10 p-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
