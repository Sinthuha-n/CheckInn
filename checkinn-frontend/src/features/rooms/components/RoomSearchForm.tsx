import { BedDouble, CalendarDays, Minus, Plus, Search, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import {
  getNextIsoDate,
  MAX_ROOMS,
  MAX_SINGLE_ROOM_GUESTS,
  MAX_TOTAL_GUESTS,
  MIN_ROOMS,
  MIN_SINGLE_ROOM_GUESTS,
  serializeRoomSearch,
  toLocalIsoDate,
  validateRoomSearch,
} from '../../../lib/roomSearch'
import type { RoomSearchErrors, RoomSearchParams } from '../../../types/search'

interface SearchFormValues {
  checkIn: string
  checkOut: string
  guests: string
  rooms: string
}

const initialValues: SearchFormValues = {
  checkIn: '',
  checkOut: '',
  guests: String(MIN_SINGLE_ROOM_GUESTS),
  rooms: String(MIN_ROOMS),
}

export function RoomSearchForm() {
  const navigate = useNavigate()
  const today = toLocalIsoDate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RoomSearchErrors>({})

  const updateValue = (field: keyof SearchFormValues, value: string) => {
    setValues((current) => {
      if (field !== 'guests') {
        return { ...current, [field]: value }
      }

      const guests = Number(value)
      const currentRooms = Number(current.rooms)

      if (
        !Number.isInteger(guests) ||
        guests < MIN_SINGLE_ROOM_GUESTS ||
        guests > MAX_TOTAL_GUESTS
      ) {
        return { ...current, guests: value }
      }

      const minimumRooms = Math.ceil(guests / MAX_SINGLE_ROOM_GUESTS)
      const maximumRooms = Math.min(MAX_ROOMS, guests)
      const rooms = Number.isInteger(currentRooms)
        ? Math.min(maximumRooms, Math.max(minimumRooms, currentRooms))
        : minimumRooms

      return { ...current, guests: value, rooms: String(rooms) }
    })
    setErrors((current) => {
      const next = { ...current }
      delete next[field]

      if (field === 'checkIn') {
        delete next.checkOut
      }

      if (field === 'guests') {
        delete next.rooms
      }

      return next
    })
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const search: RoomSearchParams = {
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      guests: Number(values.guests),
      rooms: Number(values.rooms),
    }
    const nextErrors = validateRoomSearch(search, today)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    navigate(`/rooms?${serializeRoomSearch(search)}`)
  }

  const adjustGuests = (amount: number) => {
    const currentGuests = Number(values.guests)
    const nextGuests = Number.isInteger(currentGuests)
      ? Math.min(
          MAX_TOTAL_GUESTS,
          Math.max(MIN_SINGLE_ROOM_GUESTS, currentGuests + amount),
        )
      : MIN_SINGLE_ROOM_GUESTS

    updateValue('guests', String(nextGuests))
  }

  const adjustRooms = (amount: number) => {
    const guests = Number(values.guests)
    const currentRooms = Number(values.rooms)
    const minimumRooms = Number.isInteger(guests) && guests > 0
      ? Math.ceil(guests / MAX_SINGLE_ROOM_GUESTS)
      : MIN_ROOMS
    const maximumRooms = Number.isInteger(guests) && guests > 0
      ? Math.min(MAX_ROOMS, guests)
      : MAX_ROOMS
    const nextRooms = Number.isInteger(currentRooms)
      ? Math.min(maximumRooms, Math.max(minimumRooms, currentRooms + amount))
      : minimumRooms

    updateValue('rooms', String(nextRooms))
  }

  const guestCount = Number(values.guests)
  const hasWholeGuestCount = Number.isInteger(guestCount)
  const roomCount = Number(values.rooms)
  const hasWholeRoomCount = Number.isInteger(roomCount)
  const minimumRoomCount = hasWholeGuestCount && guestCount > 0
    ? Math.ceil(guestCount / MAX_SINGLE_ROOM_GUESTS)
    : MIN_ROOMS
  const maximumRoomCount = hasWholeGuestCount && guestCount > 0
    ? Math.min(MAX_ROOMS, guestCount)
    : MAX_ROOMS

  const checkoutMinimum = values.checkIn
    ? getNextIsoDate(values.checkIn)
    : today

  return (
    <form
      aria-label="Search available rooms"
      className="stay-search"
      noValidate
      onSubmit={handleSubmit}
      role="search"
    >
      <div className="stay-search__field">
        <label htmlFor="search-check-in">
          <CalendarDays aria-hidden="true" size={18} />
          Check-in
        </label>
        <input
          aria-describedby={errors.checkIn ? 'search-check-in-error' : undefined}
          aria-invalid={Boolean(errors.checkIn)}
          id="search-check-in"
          min={today}
          onChange={(event) => updateValue('checkIn', event.target.value)}
          required
          type="date"
          value={values.checkIn}
        />
        {errors.checkIn ? (
          <span
            className="stay-search__error"
            id="search-check-in-error"
            role="alert"
          >
            {errors.checkIn}
          </span>
        ) : null}
      </div>

      <div className="stay-search__field">
        <label htmlFor="search-check-out">
          <CalendarDays aria-hidden="true" size={18} />
          Check-out
        </label>
        <input
          aria-describedby={
            errors.checkOut ? 'search-check-out-error' : undefined
          }
          aria-invalid={Boolean(errors.checkOut)}
          id="search-check-out"
          min={checkoutMinimum}
          onChange={(event) => updateValue('checkOut', event.target.value)}
          required
          type="date"
          value={values.checkOut}
        />
        {errors.checkOut ? (
          <span
            className="stay-search__error"
            id="search-check-out-error"
            role="alert"
          >
            {errors.checkOut}
          </span>
        ) : null}
      </div>

      <div className="stay-search__field">
        <label htmlFor="search-guests">
          <Users aria-hidden="true" size={18} />
          Guests
        </label>
        <div className="stay-search__stepper">
          <button
            aria-label="Decrease guests"
            disabled={
              !hasWholeGuestCount || guestCount <= MIN_SINGLE_ROOM_GUESTS
            }
            onClick={() => adjustGuests(-1)}
            title="Decrease guests"
            type="button"
          >
            <Minus aria-hidden="true" size={17} />
          </button>
          <div className="stay-search__stepper-value">
            <input
              aria-describedby={
                errors.guests ? 'search-guests-error' : undefined
              }
              aria-invalid={Boolean(errors.guests)}
              id="search-guests"
              inputMode="numeric"
              max={MAX_TOTAL_GUESTS}
              min={MIN_SINGLE_ROOM_GUESTS}
              onChange={(event) => updateValue('guests', event.target.value)}
              required
              step="1"
              type="number"
              value={values.guests}
            />
            <span aria-live="polite">
              {guestCount === 1 ? 'guest' : 'guests'}
            </span>
          </div>
          <button
            aria-label="Increase guests"
            disabled={
              hasWholeGuestCount && guestCount >= MAX_TOTAL_GUESTS
            }
            onClick={() => adjustGuests(1)}
            title="Increase guests"
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
          </button>
        </div>
        {errors.guests ? (
          <span
            className="stay-search__error"
            id="search-guests-error"
            role="alert"
          >
            {errors.guests}
          </span>
        ) : null}
      </div>

      <div className="stay-search__field">
        <label htmlFor="search-rooms">
          <BedDouble aria-hidden="true" size={18} />
          Rooms
        </label>
        <div className="stay-search__stepper">
          <button
            aria-label="Decrease rooms"
            disabled={!hasWholeRoomCount || roomCount <= minimumRoomCount}
            onClick={() => adjustRooms(-1)}
            title="Decrease rooms"
            type="button"
          >
            <Minus aria-hidden="true" size={17} />
          </button>
          <div className="stay-search__stepper-value">
            <input
              aria-describedby={errors.rooms ? 'search-rooms-error' : undefined}
              aria-invalid={Boolean(errors.rooms)}
              id="search-rooms"
              inputMode="numeric"
              max={MAX_ROOMS}
              min={MIN_ROOMS}
              onChange={(event) => updateValue('rooms', event.target.value)}
              required
              step="1"
              type="number"
              value={values.rooms}
            />
            <span aria-live="polite">
              {roomCount === 1 ? 'room' : 'rooms'}
            </span>
          </div>
          <button
            aria-label="Increase rooms"
            disabled={!hasWholeRoomCount || roomCount >= maximumRoomCount}
            onClick={() => adjustRooms(1)}
            title="Increase rooms"
            type="button"
          >
            <Plus aria-hidden="true" size={17} />
          </button>
        </div>
        {errors.rooms ? (
          <span
            className="stay-search__error"
            id="search-rooms-error"
            role="alert"
          >
            {errors.rooms}
          </span>
        ) : null}
      </div>

      <Button className="stay-search__submit" size="large" type="submit">
        Find rooms
        <Search aria-hidden="true" size={18} />
      </Button>
    </form>
  )
}
