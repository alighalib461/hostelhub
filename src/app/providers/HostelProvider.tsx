import React, { createContext, useContext, useState, useEffect } from 'react'
import { HostelWithStats, WardenPermissions, DEFAULT_WARDEN_PERMISSIONS } from '../../types/models'
import { hostelsService } from '../../services/hostels/hostelsService'
import { wardensService } from '../../services/wardens/wardensService'
import { useAuth } from './AuthProvider'

interface HostelContextType {
  selectedHostelId: string
  setSelectedHostelId: (id: string) => void
  selectedHostel: HostelWithStats | null
  hostels: HostelWithStats[]
  isLoadingHostels: boolean
  refetchHostels: () => Promise<void>
  wardenPermissions: WardenPermissions
}

const HostelContext = createContext<HostelContextType | undefined>(undefined)

export const HostelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, role } = useAuth()
  const [selectedHostelId, setSelectedHostelId] = useState<string>('all')
  const [hostels, setHostels] = useState<HostelWithStats[]>([])
  const [wardenPermissionsMap, setWardenPermissionsMap] = useState<Record<string, WardenPermissions>>({})
  const [isLoadingHostels, setIsLoadingHostels] = useState(false)

  const loadHostels = async () => {
    if (!isAuthenticated) {
      setHostels([])
      return
    }

    setIsLoadingHostels(true)
    try {
      if (role === 'owner') {
        const list = await hostelsService.getHostels()
        setHostels(list)
        if (selectedHostelId !== 'all' && !list.find((h) => h.id === selectedHostelId)) {
          setSelectedHostelId('all')
        }
      } else if (role === 'warden') {
        const { hostels: wardenHostels, permissionsMap } = await wardensService.getMyAssignedHostels()
        setHostels(wardenHostels)
        setWardenPermissionsMap(permissionsMap)
        if (wardenHostels.length > 0) {
          if (selectedHostelId === 'all' || !wardenHostels.find((h) => h.id === selectedHostelId)) {
            setSelectedHostelId(wardenHostels[0].id)
          }
        }
      } else {
        setHostels([])
      }
    } catch (err) {
      console.error('Failed to load hostels in provider:', err)
    } finally {
      setIsLoadingHostels(false)
    }
  }

  useEffect(() => {
    loadHostels()
  }, [isAuthenticated, role])

  const selectedHostel = selectedHostelId === 'all' ? null : hostels.find((h) => h.id === selectedHostelId) || null

  const activePermissions: WardenPermissions =
    role === 'owner'
      ? {
          can_view_residents: true,
          can_add_residents: true,
          can_edit_residents: true,
          can_manage_rooms: true,
          can_manage_beds: true,
          can_record_payments: true,
          can_verify_online_payments: true,
          can_view_fees: true,
          can_manage_complaints: true,
          can_manage_menu: true,
          can_create_announcements: true,
          can_view_expenses: true,
          can_manage_expenses: true,
          can_view_reports: true,
          can_check_in_out: true,
        }
      : selectedHostelId && wardenPermissionsMap[selectedHostelId]
      ? wardenPermissionsMap[selectedHostelId]
      : DEFAULT_WARDEN_PERMISSIONS

  return (
    <HostelContext.Provider
      value={{
        selectedHostelId,
        setSelectedHostelId,
        selectedHostel,
        hostels,
        isLoadingHostels,
        refetchHostels: loadHostels,
        wardenPermissions: activePermissions,
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
