import React, { useState, useEffect } from 'react'
import { useHostelContext } from '../../app/providers/HostelProvider'
import { roomsService } from '../../services/rooms/roomsService'
import { residentsService } from '../../services/residents/residentsService'
import { RoomWithBeds, ResidentWithDetails } from '../../types/models'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/shared/EmptyState'
import { Skeleton } from '../../components/ui/Skeleton'
import {
  BedDouble,
  PlusCircle,
  DoorOpen,
  User,
  Bed as BedIcon,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Building,
} from 'lucide-react'

export const RoomsBedsPage: React.FC = () => {
  const { selectedHostelId, hostels } = useHostelContext()

  const [rooms, setRooms] = useState<RoomWithBeds[]>([])
  const [activeResidents, setActiveResidents] = useState<ResidentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Add Room Modal State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false)
  const [targetHostelId, setTargetHostelId] = useState('')
  const [roomNumber, setRoomNumber] = useState('')
  const [capacity, setCapacity] = useState<number>(4)
  const [autoCreateBeds, setAutoCreateBeds] = useState(true)
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [roomError, setRoomError] = useState<string | null>(null)

  // Add Bed Modal State
  const [isAddBedOpen, setIsAddBedOpen] = useState(false)
  const [selectedRoomIdForBed, setSelectedRoomIdForBed] = useState('')
  const [bedNumber, setBedNumber] = useState('')
  const [isAddingBed, setIsAddingBed] = useState(false)

  // Assign Resident Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [assignBedId, setAssignBedId] = useState('')
  const [assignResidentId, setAssignResidentId] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    loadRoomsAndResidents()
  }, [selectedHostelId])

  const loadRoomsAndResidents = async () => {
    setIsLoading(true)
    try {
      const [roomsData, residentsData] = await Promise.all([
        roomsService.getRoomsWithBeds(selectedHostelId),
        residentsService.getResidents({
          hostelId: selectedHostelId,
          status: 'active',
        }),
      ])
      setRooms(roomsData)
      setActiveResidents(residentsData)
    } catch (err) {
      console.error('Failed to load rooms:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    const hostelToUse = targetHostelId || (selectedHostelId !== 'all' ? selectedHostelId : hostels[0]?.id)
    if (!hostelToUse) {
      setRoomError('Please select a hostel.')
      return
    }

    setRoomError(null)
    setIsCreatingRoom(true)
    try {
      await roomsService.createRoom({
        hostel_id: hostelToUse,
        room_number: roomNumber.trim(),
        capacity: Number(capacity),
        createBedsAutomatically: autoCreateBeds,
      })
      setIsAddRoomOpen(false)
      setRoomNumber('')
      loadRoomsAndResidents()
    } catch (err: unknown) {
      setRoomError((err as { message?: string })?.message || 'Failed to create room.')
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleAddBed = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoomIdForBed || !bedNumber.trim()) return
    setIsAddingBed(true)
    try {
      await roomsService.addBed({
        room_id: selectedRoomIdForBed,
        bed_number: bedNumber.trim(),
      })
      setIsAddBedOpen(false)
      setBedNumber('')
      loadRoomsAndResidents()
    } catch (err) {
      console.error('Failed to add bed:', err)
    } finally {
      setIsAddingBed(false)
    }
  }

  const handleAssignBed = async () => {
    if (!assignBedId || !assignResidentId) return
    setIsAssigning(true)
    try {
      await roomsService.assignBed(assignResidentId, assignBedId)
      setIsAssignModalOpen(false)
      setAssignResidentId('')
      setAssignBedId('')
      loadRoomsAndResidents()
    } catch (err) {
      console.error('Failed to assign bed:', err)
    } finally {
      setIsAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
            Rooms & Beds Management
          </h2>
          <p className="text-xs text-text-secondary">
            Visual interactive room layout, bed availability tracking, and atomic resident assignment
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => {
            setTargetHostelId(selectedHostelId !== 'all' ? selectedHostelId : hostels[0]?.id || '')
            setIsAddRoomOpen(true)
          }}
        >
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : rooms.length === 0 ? (
        <EmptyState
          title="No rooms created yet"
          description="Create your first room and automatically generate bed spots."
          icon={<DoorOpen className="w-8 h-8" />}
          actionLabel="Add Room"
          actionIcon={<PlusCircle className="w-4 h-4" />}
          onAction={() => setIsAddRoomOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-5 space-y-4 flex flex-col justify-between"
            >
              {/* Room Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-brand flex items-center justify-center font-bold">
                      <DoorOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary">
                        Room {room.room_number}
                      </h3>
                      <p className="text-[11px] text-text-secondary">Capacity: {room.capacity} Beds</p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      room.available_count === 0
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {room.available_count === 0
                      ? 'Fully Occupied'
                      : `${room.available_count} Available`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-brand h-full rounded-full transition-all"
                    style={{
                      width: `${room.beds.length > 0 ? (room.occupied_count / room.beds.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Beds Matrix */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                  <span>Beds ({room.beds.length})</span>
                  <button
                    onClick={() => {
                      setSelectedRoomIdForBed(room.id)
                      setBedNumber(`Bed ${room.beds.length + 1}`)
                      setIsAddBedOpen(true)
                    }}
                    className="text-blue-brand hover:underline text-[11px] flex items-center gap-1 font-bold"
                  >
                    <PlusCircle className="w-3 h-3" /> Add Bed
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {room.beds.map((bed) => {
                    const isOccupied = bed.status === 'occupied'
                    const resident = bed.current_assignment?.resident

                    return (
                      <div
                        key={bed.id}
                        className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-colors ${
                          isOccupied
                            ? 'bg-slate-50 border-slate-200/80 text-text-primary'
                            : 'bg-emerald-50/50 border-emerald-200 text-emerald-950 hover:bg-emerald-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold flex items-center gap-1">
                            <BedIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span>Bed {bed.bed_number}</span>
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                              isOccupied
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-200 text-emerald-800'
                            }`}
                          >
                            {isOccupied ? 'Occupied' : 'Free'}
                          </span>
                        </div>

                        {isOccupied && resident ? (
                          <div className="space-y-0.5">
                            <p className="font-semibold text-text-primary truncate text-[11px]">
                              {resident.full_name}
                            </p>
                            <p className="text-[10px] text-text-secondary font-mono">
                              {resident.resident_id}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAssignBedId(bed.id)
                              setIsAssignModalOpen(true)
                            }}
                            className="mt-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                          >
                            <ArrowRightLeft className="w-3 h-3" /> Assign Resident
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Room Modal */}
      <Modal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        maxWidth="md"
        title="Add New Room"
      >
        <form onSubmit={handleCreateRoom} className="space-y-4 pt-2">
          {roomError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{roomError}</span>
            </div>
          )}

          <Select
            label="Target Hostel"
            required
            value={targetHostelId}
            onChange={(e) => setTargetHostelId(e.target.value)}
            leftIcon={<Building className="w-4 h-4" />}
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>

          <Input
            label="Room Number / Identifier"
            placeholder="e.g. 101, 204, Annex-A"
            required
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
          />

          <Input
            label="Room Capacity (Beds)"
            type="number"
            min={1}
            max={20}
            required
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value))}
          />

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCreateBeds}
                onChange={(e) => setAutoCreateBeds(e.target.checked)}
                className="w-4 h-4 text-blue-brand rounded focus:ring-blue-500"
              />
              <span className="text-xs font-semibold text-text-primary">
                Automatically generate {capacity} bed spots (Bed A, Bed B, Bed C...)
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddRoomOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isCreatingRoom}>
              Create Room
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Bed Modal */}
      <Modal
        isOpen={isAddBedOpen}
        onClose={() => setIsAddBedOpen(false)}
        maxWidth="sm"
        title="Add Bed Spot to Room"
      >
        <form onSubmit={handleAddBed} className="space-y-4 pt-2">
          <Input
            label="Bed Identifier"
            placeholder="e.g. Bed D, Bed 5"
            required
            value={bedNumber}
            onChange={(e) => setBedNumber(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddBedOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={isAddingBed}>
              Add Bed
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Bed Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        maxWidth="md"
        title="Assign Resident to Bed"
      >
        <div className="space-y-4 pt-2">
          <Select
            label="Select Active Resident"
            required
            value={assignResidentId}
            onChange={(e) => setAssignResidentId(e.target.value)}
            leftIcon={<User className="w-4 h-4" />}
          >
            <option value="">Choose resident</option>
            {activeResidents.map((res) => (
              <option key={res.id} value={res.id}>
                {res.full_name} ({res.resident_id}) {res.current_assignment?.room ? `• Current Room ${res.current_assignment.room.room_number}` : '• No Bed'}
              </option>
            ))}
          </Select>

          <p className="text-[11px] text-text-secondary">
            Note: Assigning a resident will automatically close any previous bed assignment for this resident.
          </p>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="teal"
              size="sm"
              onClick={handleAssignBed}
              disabled={!assignResidentId}
              isLoading={isAssigning}
            >
              Confirm Assignment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
