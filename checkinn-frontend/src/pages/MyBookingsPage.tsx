import { CalendarDays, Download, RefreshCw, Users, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'
import { bookingApi } from '../features/bookings/bookingApi'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../services/apiClient'
import type { BookingResponse } from '../types/api'

export function MyBookingsPage() {
  const { session } = useAuth()
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!session) {
      return
    }

    let active = true
    bookingApi.mine(session.token)
      .then((result) => {
        if (active) setBookings(result)
      })
      .catch((caughtError: unknown) => {
        if (active) setError(caughtError instanceof ApiError ? caughtError.message : 'Your bookings could not be loaded.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [requestKey, session])

  const retryBookings = () => {
    setIsLoading(true)
    setError('')
    setRequestKey((key) => key + 1)
  }

  const cancelBooking = async (bookingId: number) => {
    if (!session) return
    setPendingId(bookingId)
    setError('')
    try {
      const updated = await bookingApi.cancel(bookingId, session.token)
      setBookings((current) => current.map((booking) => booking.id === updated.id ? updated : booking))
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'The booking could not be cancelled.')
    } finally {
      setPendingId(null)
    }
  }

  const downloadTicket = async (bookingId: number) => {
    if (!session) return
    setPendingId(bookingId)
    setError('')
    try {
      const ticket = await bookingApi.ticket(bookingId, session.token)
      const url = URL.createObjectURL(ticket)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `booking-${bookingId}.pdf`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'The booking ticket could not be downloaded.')
    } finally {
      setPendingId(null)
    }
  }

  return (
    <section className="bookings-page" aria-labelledby="my-bookings-title">
      <Container>
        <div className="booking-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Guest account</p>
            <h1 id="my-bookings-title">My bookings</h1>
          </div>
          <Link className="button button--secondary" to="/find-your-stay">Plan another stay</Link>
        </div>

        {isLoading ? <p className="booking-status" role="status">Loading your bookings…</p> : null}
        {error ? (
          <div className="booking-status booking-status--error" role="alert">
            <p>{error}</p>
            <button className="button button--secondary" onClick={retryBookings} type="button">
              <RefreshCw aria-hidden="true" size={17} />Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && bookings.length === 0 ? (
          <div className="booking-status">
            <h2>No stays booked yet.</h2>
            <p>Your confirmed reservations will appear here.</p>
            <Link className="button button--primary" to="/find-your-stay">Find a room</Link>
          </div>
        ) : null}

        {!isLoading && bookings.length > 0 ? (
          <div className="booking-list">
            {bookings.map((booking) => (
              <article className="booking-card" key={booking.id}>
                <div className="booking-card__heading">
                  <div><span>Reservation #{booking.id}</span><h2>{booking.roomType}</h2></div>
                  <span className={`booking-badge booking-badge--${booking.status.toLowerCase()}`}>{booking.status}</span>
                </div>
                <div className="booking-card__facts">
                  <span><CalendarDays aria-hidden="true" size={17} />{booking.checkInDate} → {booking.checkOutDate}</span>
                  <span><Users aria-hidden="true" size={17} />{booking.numberOfGuests} guests</span>
                  <span>Room {booking.roomNumber}</span>
                  <strong>{booking.totalPrice.toLocaleString()} LKR</strong>
                </div>
                <div className="booking-card__actions">
                  <Button disabled={pendingId === booking.id} onClick={() => downloadTicket(booking.id)} size="small" variant="secondary">
                    <Download aria-hidden="true" size={16} />Download ticket
                  </Button>
                  {booking.status === 'CONFIRMED' ? (
                    <Button disabled={pendingId === booking.id} onClick={() => cancelBooking(booking.id)} size="small" variant="ghost">
                      <XCircle aria-hidden="true" size={16} />Cancel booking
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
