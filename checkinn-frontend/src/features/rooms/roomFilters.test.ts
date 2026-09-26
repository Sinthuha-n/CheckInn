import type { Room } from '../../types/api'
import { applyRoomFilters, parseRoomFilters } from './roomFilters'

const rooms: Room[] = [
  {
    id: 1,
    roomNumber: '101',
    roomType: 'Courtyard King',
    description: 'Courtyard view',
    pricePerNight: 24000,
    capacity: 3,
    available: true,
  },
  {
    id: 2,
    roomNumber: '201',
    roomType: 'Family Suite',
    description: 'Family suite',
    pricePerNight: 32000,
    capacity: 5,
    available: true,
  },
]

describe('room filters', () => {
  it('parses valid filters and defaults invalid values', () => {
    expect(
      parseRoomFilters('?type=Family+Suite&maxPrice=30000&sort=price-desc'),
    ).toEqual({
      roomType: 'Family Suite',
      maxPrice: 30000,
      sort: 'price-desc',
    })

    expect(parseRoomFilters('?maxPrice=-2&sort=unknown')).toEqual({
      roomType: '',
      maxPrice: null,
      sort: 'recommended',
    })
  })

  it('filters and sorts without mutating the API result', () => {
    const originalOrder = rooms.map((room) => room.id)
    const result = applyRoomFilters(rooms, {
      roomType: '',
      maxPrice: 35000,
      sort: 'price-desc',
    })

    expect(result.map((room) => room.id)).toEqual([2, 1])
    expect(rooms.map((room) => room.id)).toEqual(originalOrder)
  })
})

