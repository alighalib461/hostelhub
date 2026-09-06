import React, { createContext, useContext, useState, useEffect } from 'react'
import { HostelWithStats } from '../../types/models'
import { hostelsService } from '../../services/hostels/hostelsService'
import { useAuth } from './AuthProvider'

interface HostelContextType {
  selectedHostelId: string
  setSelectedHostelId: (id: string) => void
  selectedHostel: HostelWithStats | null
  hostels: HostelWithStats[]
  isLoadingHostels: boolean
  refetchHostels: () => Promise<void>
}

const HostelContext = createContext<HostelContextType | undefined>(undefined)

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth()
  const [selectedHostelId, setSelectedHostelId] = useState<string>('all')
  const [hostels, setHostels] = useState<HostelWithStats[]>([])
  const [isLoadingHostels, setIsLoadingHostels] = useState(false)

  const loadHostels = async () => {
    if (!isAuthenticated || role !== 'owner') {
      setHostels([])
      return
    }

    setIsLoadingHostels(true)
    try {
      const list = await hostelsService.getHostels()
      setHostels(list)
      // If selected hostel was deleted or invalid, revert to 'all'
      if (selectedHostelId !== 'all' && !list.find((h) => h.id === selectedHostelId)) {
        setSelectedHostelId('all')
      }
    } catch (err) {
      console.error('Failed to load hostels:', err)
    } finally {
      setIsLoadingHostels(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [isAuthenticated, role])

  const selectedHostel = selectedHostelId === 'all' ? null : hostels.find((h) => h.id === selectedHostelId) || null

  return (
    <HostelContext.Provider
      value={{
        selectedHostelId,
        setSelectedHostelId,
        selectedHostel,
        hostels,
        isLoadingHostels,
        refetchHostels: loadHostels,
      }}
    >
      {children}
    </HostelContext.Provider>
  )
}

export const useHostelContext = () => {
  const context = useContext(HostelContext)
  if (!context) {
    throw new Error('useHostelContext must be used within a HostelProvider')
  }
  return context
}
