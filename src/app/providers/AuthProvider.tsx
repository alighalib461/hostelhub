import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Profile } from '../../types/models'
import { authService } from '../../services/supabase/authService'
import { supabase } from '../../services/supabase/client'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  role: 'owner' | 'resident' | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ user: User | null; profile: Profile | null }>
  signUp: (email: string, password: string, fullName: string, role: 'owner' | 'resident', phone?: string) => Promise<{ user: User | null; profile: Profile | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadUserProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null)
      setUser(null)
      setIsLoading(false)
      return null
    }

    setUser(currentUser)
    try {
      const userProfile = await authService.getCurrentProfile(currentUser.id)
      setProfile(userProfile)
      return userProfile
    } catch (err) {
      console.error('Failed to load user profile:', err)
      const meta = currentUser.user_metadata || {}
      const fallbackProfile: Profile = {
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: meta.full_name || 'Hostel Owner',
        phone: meta.phone || null,
        role: (meta.role as 'owner' | 'resident') || 'owner',
        avatar_path: null,
        created_at: currentUser.created_at || new Date().toISOString(),
        updated_at: currentUser.created_at || new Date().toISOString(),
      }
      setProfile(fallbackProfile)
      return fallbackProfile
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUserProfile(session?.user || null)
    })

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUserProfile(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const data = await authService.signIn(email, password)
      if (data.user) {
        setUser(data.user)
        setProfile(data.profile)
      }
      return { user: data.user, profile: data.profile }
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: 'owner' | 'resident', phone?: string) => {
    setIsLoading(true)
    try {
      const data = await authService.signUp(email, password, fullName, role, phone)
      if (data.user) {
        setUser(data.user)
        setProfile(data.profile)
      }
      return { user: data.user, profile: data.profile }
    } finally {
      setIsLoading(false)
    }
  }

  const signOut = async () => {
    setIsLoading(true)
    try {
      await authService.signOut()
      setUser(null)
      setProfile(null)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const updated = await authService.getCurrentProfile(user.id)
      setProfile(updated)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role || (user?.user_metadata?.role as 'owner' | 'resident') || null,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
