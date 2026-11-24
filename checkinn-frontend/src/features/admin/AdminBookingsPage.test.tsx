import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { createSession, jsonResponse } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import { authStorage } from '../auth/authStorage'
import type { BookingResponse } from '../../types/api'

const bookings: BookingResponse[] = [
  {
    id: 101,
    roomId: 1,
    roomNumber: '101',
    roomType: 'Deluxe Suite',
    pricePerNight: 150,
    userName: 'Alice Johnson',
    checkInDate: '2026-12-01',
    checkOutDate: '2026-12-05',
    numberOfGuests: 2,
    totalPrice: 600,
    status: 'CONFIRMED',
  },
  {
    id: 102,
    roomId: 2,
    roomNumber: '202',
    roomType: 'Standard King',
    pricePerNight: 100,
    userName: 'Bob Smith',
    checkInDate: '2026-10-10',
    checkOutDate: '2026-10-14',
    numberOfGuests: 1,
    totalPrice: 400,
    status: 'COMPLETED',
  },
  {
    id: 103,
    roomId: 3,
    roomNumber: '303',
    roomType: 'Penthouse Suite',
    pricePerNight: 450,
    userName: 'Charlie Brown',
    checkInDate: '2026-11-01',
    checkOutDate: '2026-11-03',
    numberOfGuests: 4,
    totalPrice: 900,
    status: 'CANCELLED',
  },
]

describe('admin booking management', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads all bookings with admin JWT and displays booking details in the table', async () => {
    const session = createSession('ADMIN')
    authStorage.write(session)
    vi.mocked(fetch).mockResolvedValue(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()

    expect(screen.getByText('#101')).toBeInTheDocument()
    expect(screen.getByText('Room 101')).toBeInTheDocument()
    expect(screen.getByText('Deluxe Suite')).toBeInTheDocument()

    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe(`Bearer ${session.token}`)
  })

  it('shows summary statistics for total, confirmed, completed, and cancelled bookings', async () => {
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    const summary = screen.getByLabelText(/3 total bookings, 1 confirmed, 1 completed, 1 cancelled/i)
    expect(within(summary).getByText('3')).toBeInTheDocument()
    expect(within(summary).getAllByText('1')).toHaveLength(2)
  })

  it('filters bookings by status when clicking status filter buttons', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    // Filter Confirmed
    await user.click(screen.getByRole('button', { name: /^confirmed$/i }))
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument()

    // Filter Completed
    await user.click(screen.getByRole('button', { name: /^completed$/i }))
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument()

    // Filter Cancelled
    await user.click(screen.getByRole('button', { name: /^cancelled$/i }))
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Smith')).not.toBeInTheDocument()

    // Back to All
    await user.click(screen.getByRole('button', { name: /^all$/i }))
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
  })

  it('filters bookings by search query across guest, room, and ID', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search by guest, room, or booking id/i)

    // Search by guest name
    await user.type(searchInput, 'bob')
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()
    expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument()

    // Clear and search by room number
    await user.clear(searchInput)
    await user.type(searchInput, '303')
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument()
    expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument()

    // Clear and search by booking ID
    await user.clear(searchInput)
    await user.type(searchInput, '101')
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
  })

  it('shows an empty state when no bookings exist in the system', async () => {
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    renderApp('/admin/bookings')

    expect(await screen.findByRole('heading', { name: /no bookings found/i })).toBeInTheDocument()
    expect(screen.getByText(/guest reservations will appear here once booked/i)).toBeInTheDocument()
  })

  it('shows no matches state with a reset filter button when filter/search yields zero results', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText(/search by guest, room, or booking id/i)
    await user.type(searchInput, 'nonexistent guest')

    expect(await screen.findByRole('heading', { name: /no matching bookings/i })).toBeInTheDocument()
    const resetButton = screen.getByRole('button', { name: /reset filters/i })
    expect(resetButton).toBeInTheDocument()

    await user.click(resetButton)
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument()
    expect(searchInput).toHaveValue('')
  })

  it('shows a loading state until bookings resolve', async () => {
    authStorage.write(createSession('ADMIN'))
    let resolveBookings!: (response: Response) => void
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveBookings = resolve
      }),
    )

    renderApp('/admin/bookings')

    expect(screen.getByRole('status')).toHaveTextContent(/loading all bookings/i)
    await act(async () => resolveBookings(jsonResponse(bookings)))
    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()
  })

  it('shows error banner with retry button on API failure', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ message: 'Bookings service is unavailable.' }, 503))
      .mockResolvedValueOnce(jsonResponse(bookings))

    renderApp('/admin/bookings')

    expect(await screen.findByText('Bookings service is unavailable.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /try again/i }))

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('allows admin to cancel a confirmed booking', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))

    const cancelledBooking: BookingResponse = {
      ...bookings[0],
      status: 'CANCELLED',
    }

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/bookings' && (!init || init.method === 'GET' || !init.method)) {
        return Promise.resolve(jsonResponse(bookings))
      }
      if (url === '/api/bookings/101/cancel' && init?.method === 'PUT') {
        return Promise.resolve(jsonResponse(cancelledBooking))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    // Booking 101 has Cancel action, Completed and Cancelled do not
    const cancelBtn = screen.getByRole('button', { name: /cancel booking #101/i })
    expect(cancelBtn).toBeInTheDocument()

    await user.click(cancelBtn)

    // Confirmation dialog opens
    expect(await screen.findByRole('heading', { name: /cancel booking #101\?/i })).toBeInTheDocument()
    expect(screen.getByText(/this will cancel the booking for/i)).toBeInTheDocument()

    const confirmCancelBtn = screen.getByRole('button', { name: /yes, cancel booking/i })
    await user.click(confirmCancelBtn)

    expect(await screen.findByText(/booking #101 has been cancelled\./i)).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings/101/cancel',
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('allows admin to request download of a booking ticket', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/bookings') {
        return Promise.resolve(jsonResponse(bookings))
      }
      if (url === '/api/bookings/101/ticket') {
        return Promise.resolve(new Response(new Blob(['pdf content']), { status: 200 }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin/bookings')

    expect(await screen.findByText('Alice Johnson')).toBeInTheDocument()

    const ticketBtn = screen.getByRole('button', { name: /download ticket for booking #101/i })
    await user.click(ticketBtn)

    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings/101/ticket',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
  })

  it('denies ordinary users without requesting bookings', async () => {
    authStorage.write(createSession('USER'))

    renderApp('/admin/bookings')

    expect(await screen.findByRole('heading', { name: /reserved for the team/i })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('redirects unauthenticated users to login', async () => {
    renderApp('/admin/bookings')

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })
})
