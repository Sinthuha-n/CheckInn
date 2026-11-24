import { act, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSession, jsonResponse } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import type { Room } from '../../types/api'
import { authStorage } from '../auth/authStorage'

const rooms: Room[] = [
  {
    id: 1,
    roomNumber: '101',
    roomType: 'Courtyard King',
    description: 'A quiet room overlooking the courtyard.',
    pricePerNight: 24000,
    capacity: 3,
    available: true,
    bedConfiguration: '1 King Bed',
    amenities: ['Free Wi-Fi'],
  },
  {
    id: 2,
    roomNumber: '202',
    roomType: 'Family Suite',
    description: 'A spacious suite for longer stays.',
    pricePerNight: 36000,
    capacity: 5,
    available: false,
    bedConfiguration: '2 Queen Beds + 1 Single Bed',
    amenities: ['Free Wi-Fi'],
  },
]

describe('admin room inventory', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('loads room inventory with the administrator JWT and shows summary totals', async () => {
    const session = createSession('ADMIN')
    authStorage.write(session)
    vi.mocked(fetch).mockResolvedValue(jsonResponse(rooms))

    renderApp('/admin')

    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '202' })).toBeInTheDocument()
    expect(screen.getByText('Courtyard King')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /24,000/ })).toBeInTheDocument()
    const table = screen.getByRole('table', { name: 'Configured CheckInn rooms' })
    expect(within(table).getByText('Available')).toBeInTheDocument()
    expect(within(table).getByText('Unavailable')).toBeInTheDocument()
    expect(screen.getByLabelText('2 total rooms, 1 available, 1 unavailable')).toBeInTheDocument()

    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms',
      expect.objectContaining({ headers: expect.any(Headers) }),
    )
    const headers = vi.mocked(fetch).mock.calls[0]?.[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe(`Bearer ${session.token}`)
  })

  it('shows a loading state until inventory resolves', async () => {
    authStorage.write(createSession('ADMIN'))
    let resolveInventory!: (response: Response) => void
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveInventory = resolve
      }),
    )

    renderApp('/admin')

    expect(screen.getByRole('status')).toHaveTextContent('Loading room inventory')
    await act(async () => resolveInventory(jsonResponse(rooms)))
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()
  })

  it('retries failed inventory loading without duplicating room rows', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch)
      .mockResolvedValueOnce(jsonResponse({ message: 'Inventory is temporarily unavailable.' }, 503))
      .mockResolvedValueOnce(jsonResponse(rooms))

    renderApp('/admin')

    expect(await screen.findByText('Inventory is temporarily unavailable.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try again/i }))

    const table = await screen.findByRole('table', { name: 'Configured CheckInn rooms' })
    expect(within(table).getAllByRole('row')).toHaveLength(3)
    expect(within(table).getAllByRole('cell', { name: '101' })).toHaveLength(1)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('shows an empty state when no rooms are configured', async () => {
    authStorage.write(createSession('ADMIN'))
    vi.mocked(fetch).mockResolvedValue(jsonResponse([]))

    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: /no rooms configured/i })).toBeInTheDocument()
    expect(screen.getByLabelText('0 total rooms, 0 available, 0 unavailable')).toBeInTheDocument()
  })

  it('denies ordinary users without requesting inventory', async () => {
    authStorage.write(createSession('USER'))

    renderApp('/admin')

    expect(await screen.findByRole('heading', { name: /reserved for the team/i })).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('opens the create modal, validates required fields, and creates a new room', async () => {
    const user = userEvent.setup()
    const session = createSession('ADMIN')
    authStorage.write(session)

    const newRoom: Room = {
      id: 3,
      roomNumber: '303',
      roomType: 'Deluxe Room',
      description: 'A sunny deluxe room on the third floor.',
      pricePerNight: 28000,
      capacity: 2,
      available: true,
      bedConfiguration: '1 King Bed',
      amenities: ['Wi-Fi'],
    }

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms' && (!init || init.method === 'GET' || !init.method)) {
        return Promise.resolve(jsonResponse(rooms))
      }
      if (url === '/api/rooms' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse(newRoom))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin')
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()

    // Open add room modal
    await user.click(screen.getByRole('button', { name: /add room/i }))
    expect(await screen.findByRole('heading', { name: 'Add a new room' })).toBeInTheDocument()

    // Trigger validation
    await user.click(screen.getByRole('button', { name: 'Create room' }))
    expect(await screen.findByText('Room number is required')).toBeInTheDocument()
    expect(screen.getByText('Room type is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(screen.getByText('Price must be greater than 0')).toBeInTheDocument()

    // Fill valid fields
    await user.type(screen.getByLabelText(/room number/i), '303')
    await user.selectOptions(screen.getByLabelText(/room type/i), 'Deluxe Room')
    await user.type(screen.getByLabelText(/description/i), 'A sunny deluxe room on the third floor.')
    await user.type(screen.getByLabelText(/price per night/i), '28000')
    await user.clear(screen.getByLabelText(/capacity/i))
    await user.type(screen.getByLabelText(/capacity/i), '2')

    // Submit form
    await user.click(screen.getByRole('button', { name: 'Create room' }))

    // Expect POST was called
    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"roomNumber":"303"'),
      }),
    )

    // Modal closes and success message shows
    expect(await screen.findByText(/room 303 has been created successfully/i)).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: '303' })).toBeInTheDocument()
  })

  it('opens the edit modal with populated room data and updates the room', async () => {
    const user = userEvent.setup()
    const session = createSession('ADMIN')
    authStorage.write(session)

    const updatedRoom: Room = {
      ...rooms[0],
      pricePerNight: 26000,
      description: 'An updated quiet courtyard room.',
    }

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms') return Promise.resolve(jsonResponse(rooms))
      if (url === '/api/rooms/1' && init?.method === 'PUT') {
        return Promise.resolve(jsonResponse(updatedRoom))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin')
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Edit room 101' }))
    expect(await screen.findByRole('heading', { name: 'Edit room' })).toBeInTheDocument()
    expect(screen.getByLabelText(/room number/i)).toHaveValue('101')

    await user.clear(screen.getByLabelText(/price per night/i))
    await user.type(screen.getByLabelText(/price per night/i), '26000')

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms/1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"pricePerNight":26000'),
      }),
    )

    expect(await screen.findByText(/room 101 has been updated successfully/i)).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /26,000/ })).toBeInTheDocument()
  })

  it('toggles availability of a room directly from the inventory table', async () => {
    const user = userEvent.setup()
    const session = createSession('ADMIN')
    authStorage.write(session)

    const toggledRoom: Room = {
      ...rooms[0],
      available: false,
    }

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms') return Promise.resolve(jsonResponse(rooms))
      if (url === '/api/rooms/1' && init?.method === 'PUT') {
        return Promise.resolve(jsonResponse(toggledRoom))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin')
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Disable room 101' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms/1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.stringContaining('"available":false'),
      }),
    )

    expect(await screen.findByText(/room 101 is now unavailable/i)).toBeInTheDocument()
  })

  it('opens delete confirmation and deletes a room', async () => {
    const user = userEvent.setup()
    const session = createSession('ADMIN')
    authStorage.write(session)

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms') return Promise.resolve(jsonResponse(rooms))
      if (url === '/api/rooms/1' && init?.method === 'DELETE') {
        return Promise.resolve(new Response(null, { status: 204 }))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin')
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete room 101' }))
    expect(await screen.findByRole('heading', { name: 'Delete room 101?' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Yes, delete room' }))

    expect(fetch).toHaveBeenCalledWith(
      '/api/rooms/1',
      expect.objectContaining({ method: 'DELETE' }),
    )

    expect(await screen.findByText(/room 101 has been deleted/i)).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: '101' })).not.toBeInTheDocument()
  })

  it('handles backend creation errors gracefully by showing the error message in the modal', async () => {
    const user = userEvent.setup()
    const session = createSession('ADMIN')
    authStorage.write(session)

    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/rooms' && (!init || init.method === 'GET' || !init.method)) {
        return Promise.resolve(jsonResponse(rooms))
      }
      if (url === '/api/rooms' && init?.method === 'POST') {
        return Promise.resolve(jsonResponse({ message: 'Room number 101 already exists' }, 409))
      }
      throw new Error(`Unexpected request: ${url}`)
    })

    renderApp('/admin')
    expect(await screen.findByRole('cell', { name: '101' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /add room/i }))
    await user.type(screen.getByLabelText(/room number/i), '101')
    await user.selectOptions(screen.getByLabelText(/room type/i), 'Deluxe Room')
    await user.type(screen.getByLabelText(/description/i), 'Duplicate room')
    await user.type(screen.getByLabelText(/price per night/i), '20000')

    await user.click(screen.getByRole('button', { name: 'Create room' }))

    expect(await screen.findByText('Room number 101 already exists')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Add a new room' })).toBeInTheDocument()
  })
})
