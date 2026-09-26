import { apiRequest } from '../../services/apiClient'
import type { Room } from '../../types/api'

export const adminRoomApi = {
  list(token: string) {
    return apiRequest<Room[]>('/rooms', { token })
  },
}

