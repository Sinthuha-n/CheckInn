import type { RoomSearchErrors, RoomSearchParams } from '../types/search'

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

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

  if (!Number.isInteger(values.guests) || values.guests < 1) {
    errors.guests = 'Guests must be a whole number of at least 1'
  }

  return errors
}

export function serializeRoomSearch(values: RoomSearchParams) {
  return new URLSearchParams({
    checkIn: values.checkIn,
    checkOut: values.checkOut,
    guests: String(values.guests),
  }).toString()
}
