import { supabase } from './client'
import { Profile } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const authService = {
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw new Error(formatErrorMessage(error))
    return session
  },

  async getCurrentProfile(userId?: string): Promise<Profile | null> {
    let user = null
    let targetId = userId

    if (!targetId) {
      const { data } = await supabase.auth.getUser()
      user = data.user
      targetId = user?.id
    } else {
      const { data } = await supabase.auth.getUser()
      user = data.user
    }

    if (!targetId) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', targetId)
      .maybeSingle()

    if (error) {
      console.warn('Profile fetch note:', error.message)
    }

    if (data) {
      return data as Profile
    }

    // Fallback: If DB row is still syncing, synthesize profile from user metadata
    if (user) {
      const meta = user.user_metadata || {}
      const fallbackRole = (meta.role as 'owner' | 'resident') || 'resident'
      return {
        id: user.id,
        email: user.email || '',
        full_name: meta.full_name || meta.name || (fallbackRole === 'owner' ? 'Hostel Owner' : 'Resident User'),
        phone: meta.phone || null,
        role: fallbackRole,
        avatar_path: meta.avatar_path || null,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: user.created_at || new Date().toISOString(),
      }
    }

    return null
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw new Error(formatErrorMessage(error))

    let profile: Profile | null = null
    if (data.user) {
      profile = await this.getCurrentProfile(data.user.id)
    }

    return {
      user: data.user,
      session: data.session,
      profile,
    }
  },

  async signUp(email: string, password: string, fullName: string, role: 'owner' | 'resident', phone?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          phone: phone || null,
        },
      },
    })
    if (error) throw new Error(formatErrorMessage(error))

    // Make sure profile exists or upsert
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          phone: phone || null,
          role,
        })
      } catch (profileErr) {
        console.warn('Profile upsert notice:', profileErr)
      }
    }

    let profile: Profile | null = null
    if (data.user) {
      profile = await this.getCurrentProfile(data.user.id)
    }

    return {
      user: data.user,
      session: data.session,
      profile,
    }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw new Error(formatErrorMessage(error))
  },

  async updateProfile(updates: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async uploadAvatar(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size exceeds 5MB limit.')
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${user.id}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, {
      upsert: true,
      cacheControl: '3600',
    })

    if (error) throw new Error(formatErrorMessage(error))

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(data.path)
    const avatarUrl = publicData.publicUrl

    // Update profile table with new avatar URL
    await this.updateProfile({ avatar_path: avatarUrl })
    return avatarUrl
  },

  async removeAvatar(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    await this.updateProfile({ avatar_path: null })
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    // 1. Try removing avatar from storage
    try {
      const { data: fileList } = await supabase.storage.from('avatars').list(user.id)
      if (fileList && fileList.length > 0) {
        const pathsToDelete = fileList.map((f) => `${user.id}/${f.name}`)
        await supabase.storage.from('avatars').remove(pathsToDelete)
      }
    } catch (storageErr) {
      console.warn('Avatar storage cleanup note:', storageErr)
    }

    // 2. Execute secure database deletion RPC (deletes personal data, hostels/unlinks residents, profile, and auth.users)
    const { data, error } = await supabase.rpc('delete_user_account')
    if (error) {
      throw new Error(formatErrorMessage(error) || 'Failed to delete account from backend.')
    }

    // 3. Clear local session
    await supabase.auth.signOut().catch(() => {})

    return (data as { success: boolean; message: string }) || {
      success: true,
      message: 'Account successfully deleted.',
    }
  },

  async submitPublicDeletionRequest(payload: {
    fullName: string
    email: string
    phone: string
    role: 'owner' | 'resident' | 'other'
    reason?: string
  }): Promise<{ requestCode: string }> {
    const { data, error } = await supabase.rpc('submit_account_deletion_request', {
      p_full_name: payload.fullName.trim(),
      p_email: payload.email.trim().toLowerCase(),
      p_phone: payload.phone.trim(),
      p_role: payload.role,
      p_reason: payload.reason?.trim() || null,
    })

    if (error) throw new Error(formatErrorMessage(error))
    
    const result = data as { success: boolean; request_code: string }
    return { requestCode: result.request_code }
  },
}

