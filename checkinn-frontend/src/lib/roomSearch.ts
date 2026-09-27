import type { RoomSearchErrors, RoomSearchParams } from '../types/search'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export const MIN_SINGLE_ROOM_GUESTS = 1
export const MAX_SINGLE_ROOM_GUESTS = 8
export const MIN_ROOMS = 1
export const MAX_ROOMS = 5
export const MAX_TOTAL_GUESTS = MAX_SINGLE_ROOM_GUESTS * MAX_ROOMS

const padDatePart = (value: number) => String(value).padStart(2, '0')

export function toLocalIsoDate(date = new Date()) {
  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join('-')
}

export function getNextIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return value
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + 1)

  return toLocalIsoDate(date)
}

export function validateRoomSearch(
  values: RoomSearchParams,
  today = toLocalIsoDate(),
): RoomSearchErrors {
  const errors: RoomSearchErrors = {}

  if (!values.checkIn) {
    errors.checkIn = 'Choose a check-in date'
  } else if (!ISO_DATE_PATTERN.test(values.checkIn)) {
    errors.checkIn = 'Enter a valid check-in date'
  } else if (values.checkIn < today) {
    errors.checkIn = 'Check-in cannot be in the past'
  }

  if (!values.checkOut) {
    errors.checkOut = 'Choose a check-out date'
  } else if (!ISO_DATE_PATTERN.test(values.checkOut)) {
    errors.checkOut = 'Enter a valid check-out date'
  } else if (values.checkIn && values.checkOut <= values.checkIn) {
    errors.checkOut = 'Check-out must be after check-in'
  }

  const hasValidGuestMinimum =
    Number.isInteger(values.guests) &&
    values.guests >= MIN_SINGLE_ROOM_GUESTS
  const hasValidRoomRange =
    Number.isInteger(values.rooms) &&
    values.rooms >= MIN_ROOMS &&
    values.rooms <= MAX_ROOMS

  if (!hasValidGuestMinimum) {
    errors.guests = 'Guests must be a whole number of at least 1'
  } else if (values.guests > MAX_TOTAL_GUESTS) {
    errors.guests = `A search can include up to ${MAX_TOTAL_GUESTS} guests`
  }

  if (!Number.isInteger(values.rooms) || values.rooms < MIN_ROOMS) {
    errors.rooms = 'Rooms must be a whole number of at least 1'
  } else if (values.rooms > MAX_ROOMS) {
    errors.rooms = `A search can include up to ${MAX_ROOMS} rooms`
  } else if (hasValidGuestMinimum && values.rooms > values.guests) {
    errors.rooms = 'Rooms cannot exceed the number of guests'
  } else if (
    hasValidGuestMinimum &&
    values.guests <= MAX_TOTAL_GUESTS &&
    hasValidRoomRange &&
    values.guests > values.rooms * MAX_SINGLE_ROOM_GUESTS
  ) {
    const requiredRooms = Math.ceil(
      values.guests / MAX_SINGLE_ROOM_GUESTS,
    )
    errors.rooms = `${values.guests} guests require at least ${requiredRooms} rooms`
  }

  return errors
}

export function serializeRoomSearch(values: RoomSearchParams) {
  return new URLSearchParams({
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests: String(values.guests),
    rooms: String(values.rooms),
  }).toString()
}

export function parseRoomSearch(search: string): RoomSearchParams | null {
  const params = new URLSearchParams(search)
  const values: RoomSearchParams = {
    checkIn: params.get('checkIn') ?? '',
    checkOut: params.get('checkOut') ?? '',
    guests: Number(params.get('guests')),
    rooms: params.has('rooms') ? Number(params.get('rooms')) : MIN_ROOMS,
  }

  return Object.keys(validateRoomSearch(values)).length === 0 ? values : null
}

export function getNumberOfNights(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`)
  const end = new Date(`${checkOut}T00:00:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}
