import { ArrowLeft, ArrowRight, CalendarDays, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'
import { bookingApi } from '../features/bookings/bookingApi'
import { useAuth } from '../features/auth/useAuth'
import { roomApi } from '../features/rooms/roomApi'
import { getNumberOfNights, parseRoomSearch } from '../lib/roomSearch'
import { ApiError } from '../services/apiClient'
import type { Room } from '../types/api'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)

export function BookingPage() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { session } = useAuth()
  const search = parseRoomSearch(location.search)
  const numericRoomId = Number(roomId)
  const invalidRoomId = !Number.isInteger(numericRoomId)
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!session || invalidRoomId) {
      return
    }

    roomApi.getById(numericRoomId, session.token)
      .then(setRoom)
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof ApiError ? caughtError.message : 'This room could not be loaded.')
      })
  }, [invalidRoomId, numericRoomId, session])

  if (!search) {
    return (
      <section className="booking-page booking-page--centered">
        <Container size="narrow">
          <p className="eyebrow eyebrow--dark">Booking details</p>
          <h1>Choose dates before booking.</h1>
          <p>Your stay dates and guest count are needed to confirm this room.</p>
          <Link className="button button--primary button--large" to="/find-your-stay">
            Find your stay
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </Container>
      </section>
    )
  }

  const nights = getNumberOfNights(search.checkIn, search.checkOut)
  const total = room ? room.pricePerNight * nights : 0
  const displayError = invalidRoomId ? 'This room could not be found.' : error

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!room || !session) {
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const booking = await bookingApi.create(
        {
          roomId: room.id,
          checkInDate: search.checkIn,
          checkOutDate: search.checkOut,
          numberOfGuests: search.guests,
        },
        session.token,
      )
      navigate(`/bookings/${booking.id}/confirmation`, {
        replace: true,
        state: { booking },
      })
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Your booking could not be completed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="booking-page" aria-labelledby="booking-title">
      <Container size="narrow">
        <Link className="text-link" to={`/rooms/${numericRoomId}${location.search}`}>
          <ArrowLeft aria-hidden="true" size={17} />
          Back to room details
        </Link>

        {!room && !displayError ? <p className="booking-status" role="status">Preparing your stay…</p> : null}

        {room ? (
          <form className="booking-review" onSubmit={handleSubmit}>
            <div>
              <p className="eyebrow eyebrow--dark">Confirm your stay</p>
              <h1 id="booking-title">One last look before arrival.</h1>
              <p>Review the stay details below. Your reservation will be confirmed immediately.</p>
            </div>

            <div className="booking-review__room">
              <span>Room {room.roomNumber}</span>
              <h2>{room.roomType}</h2>
              <p>{room.description}</p>
            </div>

            <dl className="booking-review__summary">
              <div><dt><CalendarDays aria-hidden="true" size={18} />Check-in</dt><dd>{search.checkIn}</dd></div>
              <div><dt><CalendarDays aria-hidden="true" size={18} />Check-out</dt><dd>{search.checkOut}</dd></div>
              <div><dt><Users aria-hidden="true" size={18} />Guests</dt><dd>{search.guests}</dd></div>
              <div><dt>Length of stay</dt><dd>{nights} {nights === 1 ? 'night' : 'nights'}</dd></div>
              <div><dt>Nightly rate</dt><dd>{formatPrice(room.pricePerNight)}</dd></div>
              <div className="booking-review__total"><dt>Estimated total</dt><dd>{formatPrice(total)}</dd></div>
            </dl>

            {displayError ? <p className="form-notice form-notice--error" role="alert">{displayError}</p> : null}

            <Button disabled={isSubmitting} size="large" type="submit">
              {isSubmitting ? 'Confirming your stay…' : 'Confirm booking'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
            </Button>
          </form>
        ) : displayError ? <p className="booking-status booking-status--error" role="alert">{displayError}</p> : null}
      </Container>
    </section>
  )
}
