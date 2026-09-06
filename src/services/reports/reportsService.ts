import { supabase } from '../supabase/client'
import { formatErrorMessage } from '../../utils/errorHandling'

export const reportsService = {
  async getCollectionReport(hostelId?: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('payments')
      .select(`
        *,
        resident:residents (full_name, resident_id, phone),
        hostel:hostels (name),
        fee_charge:fee_charges (fee_month)
      `)
      .order('payment_date', { ascending: false })

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }
    if (startDate) {
      query = query.gte('payment_date', startDate)
    }
    if (endDate) {
      query = query.lte('payment_date', endDate)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))

    const payments = data || []
    const totalCollected = payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + Number(p.amount), 0)
    const voidedCount = payments.filter((p) => p.status === 'voided').length

    return {
      payments,
      totalCollected,
      totalTransactions: payments.length,
      voidedCount,
    }
  },

  async getOccupancyReport(hostelId?: string) {
    let roomQuery = supabase.from('rooms').select(`
      *,
      hostel:hostels (name),
      beds (
        *,
        resident_assignments (
          is_current,
          residents (full_name, resident_id, phone)
        )
      )
    `)

    if (hostelId && hostelId !== 'all') {
      roomQuery = roomQuery.eq('hostel_id', hostelId)
    }

    const { data: rooms, error } = await roomQuery
    if (error) throw new Error(formatErrorMessage(error))

    let totalCapacity = 0
    let totalBeds = 0
    let occupiedBeds = 0
    let availableBeds = 0

    const roomDetails = (rooms || []).map((r) => {
      totalCapacity += Number(r.capacity)
      const beds = r.beds || []
      totalBeds += beds.length
      const roomOccupied = beds.filter((b: { status: string }) => b.status === 'occupied').length
      const roomAvailable = beds.filter((b: { status: string }) => b.status === 'available').length
      occupiedBeds += roomOccupied
      availableBeds += roomAvailable

      return {
        ...r,
        total_beds: beds.length,
        occupied_beds: roomOccupied,
        available_beds: roomAvailable,
        occupancy_rate: beds.length > 0 ? Math.round((roomOccupied / beds.length) * 100) : 0,
      }
    })

    const overallRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

    return {
      rooms: roomDetails,
      totalCapacity,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate: overallRate,
    }
  },

  async getPendingFeesReport(hostelId?: string) {
    let query = supabase
      .from('fee_charges')
      .select(`
        *,
        resident:residents (full_name, resident_id, phone, cnic),
        hostel:hostels (name)
      `)
      .in('status', ['pending', 'partial', 'overdue'])
      .order('due_date', { ascending: true })

    if (hostelId && hostelId !== 'all') {
      query = query.eq('hostel_id', hostelId)
    }

    const { data, error } = await query
    if (error) throw new Error(formatErrorMessage(error))

    const charges = (data || []).map((c) => ({
      ...c,
      remaining_amount: Math.max(0, Number(c.amount_due) - Number(c.amount_paid)),
    }))

    const totalOutstanding = charges.reduce((sum, c) => sum + c.remaining_amount, 0)

    return {
      charges,
      totalOutstanding,
      totalPendingCount: charges.length,
    }
  },
}
