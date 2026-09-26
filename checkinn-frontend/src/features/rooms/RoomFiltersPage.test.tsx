import { screen } from '@testing-library/react'
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
    description: 'A quiet courtyard room.',
    pricePerNight: 24000,
    capacity: 3,
    available: true,
  },
  {
    id: 2,
    roomNumber: '201',
    roomType: 'Family Suite',
    description: 'A spacious family suite.',
    pricePerNight: 32000,
    capacity: 5,
    available: true,
  },
  {
    id: 3,
    roomNumber: '106',
    roomType: 'Garden Queen',
    description: 'A garden-facing room.',
    pricePerNight: 18000,
    capacity: 2,
    available: true,
  },
]

const roomSearch = '?checkIn=2030-06-12&checkOut=2030-06-15&guests=2'

describe('room filtering and sorting', () => {
  beforeEach(() => {
    sessionStorage.clear()
    authStorage.write(createSession())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(rooms)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('filters by room type and maximum price without refetching availability', async () => {
    const user = userEvent.setup()
    renderApp(`/rooms${roomSearch}`)

    await screen.findByRole('heading', { name: 'Family Suite' })
    await user.selectOptions(screen.getByLabelText('Room type'), 'Family Suite')

    expect(screen.getByRole('heading', { name: 'Family Suite' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Courtyard King' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Room type'), '')
    await user.type(screen.getByLabelText('Maximum nightly rate'), '20000')

    expect(screen.getByRole('heading', { name: 'Garden Queen' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Family Suite' })).not.toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('sorts rooms without mutating or refetching the availability response', async () => {
    const user = userEvent.setup()
    renderApp(`/rooms${roomSearch}`)
    await screen.findByRole('heading', { name: 'Family Suite' })

    await user.selectOptions(screen.getByLabelText('Sort by'), 'price-asc')
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Garden Queen',
      'Courtyard King',
      'Family Suite',
    ])

    await user.selectOptions(screen.getByLabelText('Sort by'), 'capacity-desc')
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'Family Suite',
      'Courtyard King',
      'Garden Queen',
    ])
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('keeps search and filter parameters in room details links', async () => {
    renderApp(`/rooms${roomSearch}&type=Family+Suite&sort=price-desc`)

    const detailsLink = await screen.findByRole('link', { name: /view room details/i })
    expect(detailsLink).toHaveAttribute(
      'href',
      '/rooms/2?checkIn=2030-06-12&checkOut=2030-06-15&guests=2&type=Family+Suite&sort=price-desc',
    )
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('defaults invalid filter parameters and offers a filtered-empty reset', async () => {
    const user = userEvent.setup()
    const { router } = renderApp(`/rooms${roomSearch}&type=Unknown&maxPrice=-1&sort=invalid`)

    await screen.findByRole('heading', { name: 'Family Suite' })
    expect(screen.getByLabelText('Maximum nightly rate')).toHaveValue(null)
    expect(screen.getByLabelText('Room type')).toHaveValue('')
    expect(screen.getByLabelText('Sort by')).toHaveValue('recommended')

    await user.type(screen.getByLabelText('Maximum nightly rate'), '100')
    expect(screen.getByRole('heading', { name: /no rooms match these filters/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /clear filters/i }))
    expect(await screen.findByRole('heading', { name: 'Family Suite' })).toBeInTheDocument()
    const params = new URLSearchParams(router.state.location.search)
    expect(params.get('checkIn')).toBe('2030-06-12')
    expect(params.get('checkOut')).toBe('2030-06-15')
    expect(params.get('guests')).toBe('2')
    expect(params.has('maxPrice')).toBe(false)
    expect(params.has('sort')).toBe(false)
  })
})
