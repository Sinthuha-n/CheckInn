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
  },
  {
    id: 2,
    roomNumber: '202',
    roomType: 'Family Suite',
    description: 'A spacious suite for longer stays.',
    pricePerNight: 36000,
    capacity: 5,
    available: false,
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
})
