import React, { useEffect, useState } from 'react'
import { roomsService } from '../../services/rooms/roomsService'
import { RoomWithBeds, Bed } from '../../types/models'
import { Select } from '../ui/Select'
import { Badge } from '../ui/Badge'
import { Bed as BedIcon, DoorOpen, AlertCircle } from 'lucide-react'

export interface BedSelectorProps {
  hostelId: string
  selectedBedId?: string
  onChange: (bedId: string, roomId: string) => void
  disabled?: boolean
  error?: string
}

export const BedSelector: React.FC<BedSelectorProps> = ({
  hostelId,
  selectedBedId,
  onChange,
  disabled = false,
  error,
}) => {
  const [rooms, setRooms] = useState<RoomWithBeds[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!hostelId) {
      setRooms([])
      setSelectedRoomId('')
      return
    }

    setIsLoading(true)
    roomsService
      .getRoomsWithBeds(hostelId)
      .then((data) => {
        setRooms(data)
        // If selectedBedId is already set, find the room
        if (selectedBedId) {
          const room = data.find((r) => r.beds.some((b) => b.id === selectedBedId))
          if (room) setSelectedRoomId(room.id)
        } else if (data.length > 0) {
          // Select first room with available beds
          const roomWithAvailable = data.find((r) => r.available_count > 0)
          if (roomWithAvailable) {
            setSelectedRoomId(roomWithAvailable.id)
          } else {
            setSelectedRoomId(data[0].id)
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load rooms:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [hostelId, selectedBedId])

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId)
  const availableBeds = selectedRoom?.beds.filter((b) => b.status === 'available' || b.id === selectedBedId) || []

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Room Picker */}
        <div>
          <Select
            label="Select Room"
            value={selectedRoomId}
            onChange={(e) => {
              setSelectedRoomId(e.target.value)
              onChange('', e.target.value)
            }}
            disabled={disabled || isLoading || rooms.length === 0}
            leftIcon={<DoorOpen className="w-4 h-4" />}
          >
            <option value="">{isLoading ? 'Loading rooms...' : rooms.length === 0 ? 'No rooms in hostel' : 'Choose Room'}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                Room {room.room_number} ({room.available_count} of {room.capacity} beds free)
              </option>
            ))}
          </Select>
        </div>

        {/* Bed Picker */}
        <div>
          <Select
            label="Select Available Bed"
            value={selectedBedId || ''}
            onChange={(e) => {
              if (selectedRoomId) {
                onChange(e.target.value, selectedRoomId)
              }
            }}
            disabled={disabled || isLoading || !selectedRoomId || availableBeds.length === 0}
            error={error}
            leftIcon={<BedIcon className="w-4 h-4" />}
          >
            <option value="">
              {!selectedRoomId
                ? 'Select a room first'
                : availableBeds.length === 0
                ? 'No free beds in this room'
                : 'Choose Bed'}
            </option>
            {availableBeds.map((bed: Bed) => (
              <option key={bed.id} value={bed.id}>
                Bed {bed.bed_number} {bed.id === selectedBedId ? '(Current)' : '(Available)'}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Visual Bed Tiles preview */}
      {selectedRoom && (
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-text-primary">
              Room {selectedRoom.room_number} Bed Availability:
            </span>
            <span className="text-[11px] text-text-secondary">
              {selectedRoom.occupied_count} Occupied • {selectedRoom.available_count} Available
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {selectedRoom.beds.map((bed) => {
              const isSelected = bed.id === selectedBedId
              const isAvailable = bed.status === 'available' || isSelected
              return (
                <button
                  type="button"
                  key={bed.id}
                  disabled={!isAvailable || disabled}
                  onClick={() => onChange(bed.id, selectedRoom.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 border-blue-brand text-blue-900 ring-2 ring-blue-500/20'
                      : isAvailable
                      ? 'bg-white border-emerald-200 text-emerald-900 hover:border-emerald-400 cursor-pointer'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between font-semibold mb-1">
                    <span>Bed {bed.bed_number}</span>
                    <BedIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    {isSelected ? (
                      <Badge variant="info" size="sm">Selected</Badge>
                    ) : isAvailable ? (
                      <Badge variant="success" size="sm">Available</Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">Occupied</Badge>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {rooms.length === 0 && !isLoading && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>This hostel has no rooms added yet. Please add rooms and beds before assigning residents.</span>
        </div>
      )}
    </div>
  )
}
