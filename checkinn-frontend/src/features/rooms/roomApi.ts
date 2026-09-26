import { apiRequest } from '../../services/apiClient'
import type { Room } from '../../types/api'
import type { RoomSearchParams } from '../../types/search'

export const roomApi = {
  available(search: RoomSearchParams, token: string) {
    const query = new URLSearchParams({
      checkIn: search.checkIn,
      checkOut: search.checkOut,
    })

    return apiRequest<Room[]>(`/rooms/available?${query.toString()}`, { token })
  },

  getById(roomId: number, token: string) {
    return apiRequest<Room>(`/rooms/${roomId}`, { token })
  },
}
