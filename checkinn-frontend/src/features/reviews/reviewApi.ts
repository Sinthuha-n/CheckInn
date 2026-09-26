import { apiRequest } from '../../services/apiClient'
import type { ReviewRequest, ReviewResponse } from '../../types/api'

export const reviewApi = {
  forRoom(roomId: number) {
    return apiRequest<ReviewResponse[]>(`/reviews/room/${roomId}`)
  },

  create(request: ReviewRequest, token: string) {
    return apiRequest<ReviewResponse>('/reviews', {
      method: 'POST',
      body: request,
      token,
    })
  },
}
