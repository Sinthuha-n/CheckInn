import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { authStorage } from '../auth/authStorage'
import { createSession, jsonResponse } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import type { BookingResponse, Room } from '../../types/api'

const room: Room = {
  id: 7,
  roomNumber: '204',
  roomType: 'Courtyard King',
  description: 'A quiet room overlooking the courtyard.',
  pricePerNight: 24000,
  capacity: 3,
  available: true,
}

const booking: BookingResponse = {
  id: 18,
  userName: 'Avery Guest',
  roomId: room.id,
  roomNumber: room.roomNumber,
  roomType: room.roomType,
  pricePerNight: room.pricePerNight,
  checkInDate: '2030-06-12',
  checkOutDate: '2030-06-15',
  numberOfGuests: 2,
  totalPrice: 72000,
  status: 'CONFIRMED',
}

describe('protected booking flow', () => {
  beforeEach(() => {
    sessionStorage.clear()
    authStorage.write(createSession())
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads available rooms and filters results by guest capacity', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse([
        { ...room, id: 6, roomType: 'Compact Queen', capacity: 1 },
        room,
      ]),
    )

    renderApp('/rooms?checkIn=2030-06-12&checkOut=2030-06-15&guests=2')

    expect(await screen.findByRole('heading', { name: room.roomType })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /compact queen/i })).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms/available?checkIn=2030-06-12&checkOut=2030-06-15',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it('creates a booking and opens its confirmation page', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse(room))
      .mockResolvedValueOnce(jsonResponse(booking))

    const { router } = renderApp('/rooms/7/book?checkIn=2030-06-12&checkOut=2030-06-15&guests=2')

    await screen.findByRole('heading', { name: room.roomType })
    await user.click(screen.getByRole('button', { name: /confirm booking/i }))

    expect(await screen.findByRole('heading', { name: /your room is ready for you/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/bookings/18/confirmation')
    expect(fetch).toHaveBeenLastCalledWith(
      '/api/bookings',
      expect.objectContaining({
        body: JSON.stringify({
          roomId: 7,
          checkInDate: '2030-06-12',
          checkOutDate: '2030-06-15',
          numberOfGuests: 2,
        }),
        method: 'POST',
      }),
    )
  })

  it('redirects a confirmation opened without response state to My Bookings', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))
    const { router } = renderApp('/bookings/18/confirmation')

    expect(await screen.findByRole('heading', { name: /my bookings/i })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/my-bookings')
  })

  it('loads and cancels a confirmed booking', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([booking]))
      .mockResolvedValueOnce(jsonResponse({ ...booking, status: 'CANCELLED' }))

    renderApp('/my-bookings')

    await screen.findByRole('heading', { name: room.roomType })
    await user.click(screen.getByRole('button', { name: /cancel booking/i }))

    expect(await screen.findByText('CANCELLED')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel booking/i })).not.toBeInTheDocument()
  })

  it('downloads a booking ticket from the authenticated endpoint', async () => {
    const user = userEvent.setup()
    const createObjectUrl = vi.fn(() => 'blob:ticket')
    const revokeObjectUrl = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: createObjectUrl,
      revokeObjectURL: revokeObjectUrl,
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse([booking]))
      .mockResolvedValueOnce(new Response(new Blob(['ticket']), { status: 200 }))

    renderApp('/my-bookings')
    await screen.findByRole('heading', { name: room.roomType })
    await user.click(screen.getByRole('button', { name: /download ticket/i }))

    expect(createObjectUrl).toHaveBeenCalled()
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:ticket')
  })
})
