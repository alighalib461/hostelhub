import { supabase } from '../supabase/client'
import {
  ComplaintWithDetails,
  Complaint,
  ComplaintStatus,
  ComplaintPriority,
  CreateComplaintPayload,
} from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const complaintsService = {
  async getComplaints(options?: {
    hostelId?: string
    residentId?: string
    status?: ComplaintStatus | 'all'
    category?: string | 'all'
    priority?: ComplaintPriority | 'all'
    search?: string
  }): Promise<ComplaintWithDetails[]> {
    let query = supabase
      .from('complaints')
      .select(`
        *,
        resident:residents (*),
        hostel:hostels (*),
        room:rooms (*),
        bed:beds (*),
        resolver:profiles!complaints_resolved_by_fkey (*)
      `)
      .order('created_at', { ascending: false })

    if (options?.hostelId && options.hostelId !== 'all') {
      query = query.eq('hostel_id', options.hostelId)
    }

    if (options?.residentId) {
      query = query.eq('resident_id', options.residentId)
    }

    if (options?.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options?.category && options.category !== 'all') {
      query = query.eq('category', options.category)
    }

    if (options?.priority && options.priority !== 'all') {
      query = query.eq('priority', options.priority)
    }

    if (options?.search && options.search.trim()) {
      const term = options.search.trim()
      query = query.or(`subject.ilike.%${term}%,description.ilike.%${term}%,complaint_code.ilike.%${term}%`)
    }

    const { data, error } = await query

    if (error) {
      // If foreign key reference name differs in Supabase, fallback to simpler select
      const fallbackQuery = supabase
        .from('complaints')
        .select(`
          *,
          resident:residents (*),
          hostel:hostels (*),
          room:rooms (*),
          bed:beds (*)
        `)
        .order('created_at', { ascending: false })

      let filteredFallback = fallbackQuery
      if (options?.hostelId && options.hostelId !== 'all') {
        filteredFallback = filteredFallback.eq('hostel_id', options.hostelId)
      }
      if (options?.residentId) {
        filteredFallback = filteredFallback.eq('resident_id', options.residentId)
      }
      if (options?.status && options.status !== 'all') {
        filteredFallback = filteredFallback.eq('status', options.status)
      }
      if (options?.category && options.category !== 'all') {
        filteredFallback = filteredFallback.eq('category', options.category)
      }
      if (options?.priority && options.priority !== 'all') {
        filteredFallback = filteredFallback.eq('priority', options.priority)
      }
      if (options?.search && options.search.trim()) {
        const term = options.search.trim()
        filteredFallback = filteredFallback.or(`subject.ilike.%${term}%,description.ilike.%${term}%,complaint_code.ilike.%${term}%`)
      }

      const { data: fallbackData, error: fallbackError } = await filteredFallback
      if (fallbackError) throw new Error(formatErrorMessage(fallbackError))
      return (fallbackData || []) as ComplaintWithDetails[]
    }

    return (data || []) as ComplaintWithDetails[]
  },

  async getComplaintById(id: string): Promise<ComplaintWithDetails | null> {
    const { data, error } = await supabase
      .from('complaints')
      .select(`
        *,
        resident:residents (*),
        hostel:hostels (*),
        room:rooms (*),
        bed:beds (*)
      `)
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(formatErrorMessage(error))
    return data as ComplaintWithDetails | null
  },

  async createComplaint(payload: CreateComplaintPayload): Promise<Complaint> {
    const { data, error } = await supabase
      .from('complaints')
      .insert({
        resident_id: payload.resident_id,
        hostel_id: payload.hostel_id,
        room_id: payload.room_id || null,
        bed_id: payload.bed_id || null,
        category: payload.category,
        subject: payload.subject.trim(),
        description: payload.description.trim(),
        priority: payload.priority || 'normal',
        status: 'submitted',
        photo_path: payload.photo_path || null,
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async updateComplaintStatus(
    id: string,
    status: ComplaintStatus,
    resolutionNote?: string
  ): Promise<Complaint> {
    const { data: { user } } = await supabase.auth.getUser()

    const updates: Partial<Complaint> = {
      status,
      updated_at: new Date().toISOString(),
    }

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString()
      updates.resolved_by = user?.id || null
      if (resolutionNote !== undefined) {
        updates.resolution_note = resolutionNote.trim() || null
      }
    } else if (resolutionNote !== undefined && resolutionNote.trim() !== '') {
      updates.resolution_note = resolutionNote.trim()
    }

    const { data, error } = await supabase
      .from('complaints')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async getComplaintsSummary(hostelId?: string): Promise<{
    total: number
    submitted: number
    in_progress: number
    resolved: number
    unresolved: number
  }> {
    let query = supabase
      .from('complaints')
      .select('status')

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    const { data, error } = await query
    if (error || !data) {
      return { total: 0, submitted: 0, in_progress: 0, resolved: 0, unresolved: 0 }
    }

    let submitted = 0
    let inProgress = 0
    let resolved = 0

    data.forEach((c) => {
      if (c.status === 'submitted') submitted++
      else if (c.status === 'in_progress') inProgress++
      else if (c.status === 'resolved') resolved++
    })

    return {
      total: data.length,
      submitted,
      in_progress: inProgress,
      resolved,
      unresolved: submitted + inProgress,
    }
  },
}
