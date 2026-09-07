import { supabase } from '../supabase/client'
import { RoomWithBeds, Room, Bed } from '../../types/models'
import { formatErrorMessage } from '../../utils/errorHandling'

export const roomsService = {
  async getRoomsWithBeds(hostelId?: string): Promise<RoomWithBeds[]> {
    let query = supabase
      .from('rooms')
      .select(`
        *,
        beds (
          *,
          resident_assignments (
            *,
            residents (*)
          )
        )
      `)
      .order('room_number', { ascending: true })

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    const { data, error } = await query

    if (error) throw new Error(formatErrorMessage(error))
    if (!data) return []

    return data.map((room) => {
      const beds = (room.beds || []).map((bed) => {
        const currentAssignment = (bed.resident_assignments || []).find(
          (a: { is_current: boolean }) => a.is_current
        )
        return {
          ...bed,
          current_assignment: currentAssignment
            ? {
                ...currentAssignment,
                resident: currentAssignment.residents,
              }
            : null,
        }
      })

      const occupiedCount = beds.filter((b) => b.status === 'occupied').length
      const availableCount = beds.filter((b) => b.status === 'available').length

      return {
        ...room,
        beds,
        occupied_count: occupiedCount,
        available_count: availableCount,
      }
    })
  },

  async createRoom(room: {
    hostel_id: string
    room_number: string
    capacity: number
    createBedsAutomatically?: boolean
  }): Promise<Room> {
    const { data: createdRoom, error } = await supabase
      .from('rooms')
      .insert({
        hostel_id: room.hostel_id,
        room_number: room.room_number,
        capacity: room.capacity,
        status: 'active',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))

    // Automatically create beds if requested (e.g. Bed A, Bed B, Bed C...)
    if (room.createBedsAutomatically && createdRoom) {
      const bedLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
      const bedsToInsert = Array.from({ length: room.capacity }, (_, i) => ({
        room_id: createdRoom.id,
        bed_number: bedLetters[i] || `Bed-${i + 1}`,
        status: 'available' as const,
      }))

      const { error: bedError } = await supabase.from('beds').insert(bedsToInsert)
      if (bedError) {
        console.warn('Error creating default beds:', bedError)
      }
    }

    return createdRoom
  },

  async addBed(bed: {
    room_id: string
    bed_number: string
    status?: 'available' | 'occupied' | 'inactive'
  }): Promise<Bed> {
    const { data, error } = await supabase
      .from('beds')
      .insert({
        room_id: bed.room_id,
        bed_number: bed.bed_number,
        status: bed.status || 'available',
      })
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async updateBedStatus(bedId: string, status: 'available' | 'occupied' | 'inactive'): Promise<Bed> {
    const { data, error } = await supabase
      .from('beds')
      .update({ status })
      .eq('id', bedId)
      .select()
      .single()

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async assignBed(residentId: string, bedId: string, startDate?: string) {
    const { data, error } = await supabase.rpc('assign_bed', {
      p_resident_id: residentId,
      p_bed_id: bedId,
      p_start_date: startDate || new Date().toISOString().slice(0, 10),
    })

    if (error) throw new Error(formatErrorMessage(error))
    return data
  },

  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase.from('rooms').delete().eq('id', roomId)
    if (error) throw new Error(formatErrorMessage(error))
  },
}
