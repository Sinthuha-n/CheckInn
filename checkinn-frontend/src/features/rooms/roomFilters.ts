import type { Room } from '../../types/api'

export type RoomSort =
  | 'recommended'
  | 'price-asc'
  | 'price-desc'
  | 'capacity-desc'

export interface RoomFilters {
  roomType: string
  maxPrice: number | null
  sort: RoomSort
}

const ROOM_SORTS = new Set<RoomSort>([
  'recommended',
  'price-asc',
  'price-desc',
  'capacity-desc',
])

export const DEFAULT_ROOM_FILTERS: RoomFilters = {
  roomType: '',
  maxPrice: null,
  sort: 'recommended',
}

export function parseRoomFilters(search: string): RoomFilters {
  const params = new URLSearchParams(search)
  const maxPriceValue = Number(params.get('maxPrice'))
  const sortValue = params.get('sort') as RoomSort | null

  return {
    roomType: params.get('type')?.trim() ?? '',
    maxPrice:
      Number.isFinite(maxPriceValue) && maxPriceValue > 0
        ? maxPriceValue
        : null,
    sort: sortValue && ROOM_SORTS.has(sortValue) ? sortValue : 'recommended',
  }
}

export function applyRoomFilters(rooms: Room[], filters: RoomFilters) {
  const filteredRooms = rooms.filter(
    (room) =>
      (!filters.roomType || room.roomType === filters.roomType) &&
      (filters.maxPrice === null || room.pricePerNight <= filters.maxPrice),
  )

  if (filters.sort === 'recommended') {
    return filteredRooms
  }

  return filteredRooms.sort((first, second) => {
    switch (filters.sort) {
      case 'price-asc':
        return first.pricePerNight - second.pricePerNight
      case 'price-desc':
        return second.pricePerNight - first.pricePerNight
      case 'capacity-desc':
        return second.capacity - first.capacity
      default:
        return 0
    }
  })
}
