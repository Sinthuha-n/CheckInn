import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Link, Navigate, useLocation, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import type { BookingResponse } from '../types/api'

interface ConfirmationState {
  booking?: BookingResponse
}

export function BookingConfirmationPage() {
  const { bookingId } = useParams()
  const location = useLocation()
  const state = (location.state as ConfirmationState | null) ?? null
  const booking = state?.booking

  if (!booking || String(booking.id) !== bookingId) {
    return <Navigate replace to="/my-bookings" />
  }

  return (
    <section className="booking-page booking-page--centered" aria-labelledby="confirmation-title">
      <Container size="narrow">
        <div className="confirmation-mark"><CheckCircle2 aria-hidden="true" size={34} strokeWidth={1.5} /></div>
        <p className="eyebrow eyebrow--dark">Booking confirmed</p>
        <h1 id="confirmation-title">Your room is ready for you.</h1>
        <p>
          Reservation #{booking.id} is confirmed for {booking.roomType}, room {booking.roomNumber}.
        </p>
        <div className="confirmation-summary">
          <span>{booking.checkInDate} → {booking.checkOutDate}</span>
          <span>{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}</span>
          <strong>{booking.totalPrice.toLocaleString()} LKR</strong>
        </div>
        <Link className="button button--primary button--large" to="/my-bookings">
          View my bookings
          <ArrowRight aria-hidden="true" size={18} />
        </Link>
      </Container>
    </section>
  )
}
