import { apiDownload, apiRequest } from '../../services/apiClient'
import type { BookingRequest, BookingResponse } from '../../types/api'

export const bookingApi = {
  create(request: BookingRequest, token: string) {
    return apiRequest<BookingResponse>('/bookings', {
      method: 'POST',
      body: request,
      token,
    })
  },

  mine(token: string) {
    return apiRequest<BookingResponse[]>('/bookings/my', { token })
  },

  cancel(bookingId: number, token: string) {
    return apiRequest<BookingResponse>(`/bookings/${bookingId}/cancel`, {
      method: 'PUT',
      token,
    })
  },

  ticket(bookingId: number, token: string) {
    return apiDownload(`/bookings/${bookingId}/ticket`, { token })
  },
}
