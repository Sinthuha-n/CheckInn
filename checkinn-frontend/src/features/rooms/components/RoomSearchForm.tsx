import { CalendarDays, Search, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../../../components/ui/Button'
import {
  getNextIsoDate,
  serializeRoomSearch,
  toLocalIsoDate,
  validateRoomSearch,
} from '../../../lib/roomSearch'
import type { RoomSearchErrors, RoomSearchParams } from '../../../types/search'

interface SearchFormValues {
  checkIn: string
  checkOut: string
  guests: string
}

const initialValues: SearchFormValues = {
  checkIn: '',
  checkOut: '',
  guests: '2',
}

export function RoomSearchForm() {
  const navigate = useNavigate()
  const today = toLocalIsoDate()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<RoomSearchErrors>({})

  const updateValue = (field: keyof SearchFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      const next = { ...current }
      delete next[field]

      if (field === 'checkIn') {
        delete next.checkOut
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
    }
    const nextErrors = validateRoomSearch(search, today)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    navigate(`/rooms?${serializeRoomSearch(search)}`)
  }

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
        <input
          aria-describedby={errors.guests ? 'search-guests-error' : undefined}
          aria-invalid={Boolean(errors.guests)}
          id="search-guests"
          inputMode="numeric"
          min="1"
          onChange={(event) => updateValue('guests', event.target.value)}
          required
          step="1"
          type="number"
          value={values.guests}
        />
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

      <Button className="stay-search__submit" size="large" type="submit">
        Find a room
        <Search aria-hidden="true" size={18} />
      </Button>
    </form>
  )
}
