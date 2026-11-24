import { apiRequest } from '../../services/apiClient'
import type { Room } from '../../types/api'

export interface RoomPayload {
  roomNumber: string
  roomType: string
  description: string
  pricePerNight: number
  capacity: number
  available: boolean
  bedConfiguration: string
  amenities: string[]
}

export const adminRoomApi = {
  list(token: string) {
    return apiRequest<Room[]>('/rooms', { token })
  },

  create(payload: RoomPayload, token: string) {
    return apiRequest<Room>('/rooms', {
      method: 'POST',
      body: payload,
      token,
    })
  },

  update(roomId: number, payload: RoomPayload, token: string) {
    return apiRequest<Room>(`/rooms/${roomId}`, {
      method: 'PUT',
      body: payload,
      token,
    })
  },

  deleteRoom(roomId: number, token: string) {
    return apiRequest<void>(`/rooms/${roomId}`, {
      method: 'DELETE',
      token,
    })
  },
}
