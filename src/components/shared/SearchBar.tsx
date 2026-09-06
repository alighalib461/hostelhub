import React, { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export interface SearchBarProps {
  value?: string
  placeholder?: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  placeholder = 'Search by name, resident ID, CNIC, or phone...',
  onChange,
  debounceMs = 300,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState(value)

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== value) {
        onChange(searchTerm)
      }
    }, debounceMs)

    return () => clearTimeout(handler)
  }, [searchTerm, debounceMs, onChange, value])

  return (
    <div className={cn('relative flex items-center w-full max-w-md', className)}>
      <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-white border border-slate-300 text-text-primary text-sm rounded-xl pl-10 pr-10 py-2.5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400"
      />
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm('')
            onChange('')
          }}
          className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
