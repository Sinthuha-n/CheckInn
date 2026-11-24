import {
  Ban,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  RefreshCw,
  Search,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'
import { useAuth } from '../features/auth/useAuth'
import { bookingApi } from '../features/bookings/bookingApi'
import { ApiError } from '../services/apiClient'
import type { BookingResponse, BookingStatus } from '../types/api'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)

type FilterStatus = 'ALL' | BookingStatus

export function AdminBookingsPage() {
  const { session } = useAuth()
  const [bookings, setBookings] = useState<BookingResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [cancellingBooking, setCancellingBooking] = useState<BookingResponse | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  useEffect(() => {
    if (!session) return

    let active = true

    bookingApi
      .all(session.token)
      .then((result) => {
        if (active) setBookings(result)
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(
            caughtError instanceof ApiError
              ? caughtError.message
              : 'Bookings could not be loaded. Please try again.',
          )
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [requestKey, session])

  const summary = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length
    const cancelled = bookings.filter((b) => b.status === 'CANCELLED').length
    return { total: bookings.length, confirmed, completed, cancelled }
  }, [bookings])

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus =
        statusFilter === 'ALL' || b.status === statusFilter
      const term = searchTerm.trim().toLowerCase()
      const matchesSearch =
        !term ||
        b.userName.toLowerCase().includes(term) ||
        b.roomNumber.toLowerCase().includes(term) ||
        b.roomType.toLowerCase().includes(term) ||
        String(b.id).includes(term)

      return matchesStatus && matchesSearch
    })
  }, [bookings, searchTerm, statusFilter])

  const retryBookings = () => {
    setIsLoading(true)
    setError('')
    setRequestKey((k) => k + 1)
  }

  const handleCancelBooking = async () => {
    if (!session || !cancellingBooking) return
    setIsCancelling(true)
    setActionError('')
    setActionSuccess('')
    try {
      const updated = await bookingApi.cancel(cancellingBooking.id, session.token)
      setBookings((prev) =>
        prev.map((b) => (b.id === updated.id ? updated : b)),
      )
      setActionSuccess(`Booking #${updated.id} has been cancelled.`)
      setCancellingBooking(null)
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not cancel booking. Please try again.',
      )
    } finally {
      setIsCancelling(false)
    }
  }

  const handleDownloadTicket = async (bookingId: number) => {
    if (!session) return
    setActionError('')
    try {
      const blob = await bookingApi.ticket(bookingId, session.token)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `booking-${bookingId}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not download booking ticket.',
      )
    }
  }

  return (
    <section className="admin-page" aria-labelledby="admin-bookings-title">
      <Container>
        {/* ── Admin Subnav ── */}
        <nav className="admin-nav" aria-label="Admin sections">
          <NavLink
            className={({ isActive }) =>
              `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`
            }
            to="/admin"
            end
          >
            Room inventory
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `admin-nav__link ${isActive ? 'admin-nav__link--active' : ''}`
            }
            to="/admin/bookings"
          >
            Guest bookings
          </NavLink>
        </nav>

        {/* ── Heading ── */}
        <div className="admin-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Operations desk</p>
            <h1 id="admin-bookings-title">Guest bookings</h1>
          </div>
          <Button onClick={retryBookings} variant="secondary">
            <RefreshCw aria-hidden="true" size={16} />
            Refresh
          </Button>
        </div>

        {/* ── Success / Error Alerts ── */}
        {actionSuccess ? (
          <p className="form-notice form-notice--success" role="status">
            {actionSuccess}
          </p>
        ) : null}
        {actionError ? (
          <p className="form-notice form-notice--error" role="alert">
            {actionError}
          </p>
        ) : null}

        {/* ── Summary Stats ── */}
        {!isLoading && !error ? (
          <dl
            aria-label={`${summary.total} total bookings, ${summary.confirmed} confirmed, ${summary.completed} completed, ${summary.cancelled} cancelled`}
            className="admin-summary"
          >
            <div>
              <dt>Total bookings</dt>
              <dd>{summary.total}</dd>
            </div>
            <div>
              <dt>Confirmed</dt>
              <dd>{summary.confirmed}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{summary.completed}</dd>
            </div>
          </dl>
        ) : null}

        {/* ── Search & Filter Toolbar ── */}
        {!isLoading && !error && bookings.length > 0 ? (
          <div className="admin-toolbar">
            <div className="admin-search">
              <Search aria-hidden="true" size={18} />
              <input
                aria-label="Search bookings by guest name, room, or ID"
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by guest, room, or booking ID…"
                type="search"
                value={searchTerm}
              />
            </div>

            <div className="admin-filter-group" role="group" aria-label="Filter by booking status">
              {(['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const).map(
                (status) => (
                  <button
                    className={`admin-filter-btn ${
                      statusFilter === status ? 'admin-filter-btn--active' : ''
                    }`}
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    type="button"
                  >
                    {status === 'ALL'
                      ? 'All'
                      : status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                ),
              )}
            </div>
          </div>
        ) : null}

        {/* ── Loading State ── */}
        {isLoading ? (
          <div className="admin-state" role="status">
            <CalendarCheck aria-hidden="true" size={24} />
            Loading all bookings…
          </div>
        ) : null}

        {/* ── Load Error State ── */}
        {error ? (
          <div className="admin-state admin-state--error" role="alert">
            <p>{error}</p>
            <button
              className="button button--secondary"
              onClick={retryBookings}
              type="button"
            >
              <RefreshCw aria-hidden="true" size={17} />
              Try again
            </button>
          </div>
        ) : null}

        {/* ── Empty State (No Bookings Ever) ── */}
        {!isLoading && !error && bookings.length === 0 ? (
          <div className="admin-state">
            <CalendarCheck aria-hidden="true" size={26} />
            <h2>No bookings found.</h2>
            <p>Guest reservations will appear here once booked.</p>
          </div>
        ) : null}

        {/* ── Empty State (Filters Matched Nothing) ── */}
        {!isLoading && !error && bookings.length > 0 && filteredBookings.length === 0 ? (
          <div className="admin-state">
            <CalendarCheck aria-hidden="true" size={26} />
            <h2>No matching bookings.</h2>
            <p>Try adjusting your search query or status filter.</p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
              }}
              variant="secondary"
            >
              Reset filters
            </Button>
          </div>
        ) : null}

        {/* ── Table Layout ── */}
        {!isLoading && !error && filteredBookings.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption>CheckInn guest bookings</caption>
              <thead>
                <tr>
                  <th scope="col">Booking ID</th>
                  <th scope="col">Guest</th>
                  <th scope="col">Room</th>
                  <th scope="col">Dates</th>
                  <th scope="col">Guests</th>
                  <th scope="col">Total price</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td data-label="Booking ID">
                      <strong>#{booking.id}</strong>
                    </td>
                    <td data-label="Guest">
                      <strong>{booking.userName}</strong>
                    </td>
                    <td data-label="Room">
                      <strong>Room {booking.roomNumber}</strong>
                      <span>{booking.roomType}</span>
                    </td>
                    <td data-label="Dates">
                      <span>{booking.checkInDate}</span>
                      <small> to </small>
                      <span>{booking.checkOutDate}</span>
                    </td>
                    <td data-label="Guests">
                      {booking.numberOfGuests}{' '}
                      {booking.numberOfGuests === 1 ? 'guest' : 'guests'}
                    </td>
                    <td data-label="Total price">
                      <strong>{formatPrice(booking.totalPrice)}</strong>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`admin-status admin-status--${booking.status.toLowerCase()}`}
                      >
                        {booking.status === 'CONFIRMED' && (
                          <Clock aria-hidden="true" size={15} />
                        )}
                        {booking.status === 'COMPLETED' && (
                          <CheckCircle2 aria-hidden="true" size={15} />
                        )}
                        {booking.status === 'CANCELLED' && (
                          <XCircle aria-hidden="true" size={15} />
                        )}
                        {booking.status}
                      </span>
                    </td>
                    <td data-label="Actions" className="admin-table__actions">
                      <button
                        aria-label={`Download ticket for booking #${booking.id}`}
                        className="admin-action-btn"
                        onClick={() => handleDownloadTicket(booking.id)}
                        title="Download ticket"
                        type="button"
                      >
                        <Download aria-hidden="true" size={15} />
                        Ticket
                      </button>
                      {booking.status === 'CONFIRMED' ? (
                        <button
                          aria-label={`Cancel booking #${booking.id}`}
                          className="admin-action-btn admin-action-btn--delete"
                          onClick={() => {
                            setActionError('')
                            setActionSuccess('')
                            setCancellingBooking(booking)
                          }}
                          type="button"
                        >
                          <Ban aria-hidden="true" size={15} />
                          Cancel
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Container>

      {/* ── Cancel Booking Modal ── */}
      {cancellingBooking ? (
        <dialog
          aria-labelledby="cancel-booking-dialog-title"
          aria-modal="true"
          className="confirm-modal"
          open
        >
          <div className="confirm-modal__panel">
            <Ban aria-hidden="true" size={28} />
            <h2 id="cancel-booking-dialog-title">
              Cancel booking #{cancellingBooking.id}?
            </h2>
            <p>
              This will cancel the booking for{' '}
              <strong>{cancellingBooking.userName}</strong> in room{' '}
              <strong>{cancellingBooking.roomNumber}</strong> ({cancellingBooking.checkInDate} to{' '}
              {cancellingBooking.checkOutDate}).
            </p>
            {actionError ? (
              <p className="form-notice form-notice--error" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="confirm-modal__actions">
              <Button
                disabled={isCancelling}
                onClick={() => setCancellingBooking(null)}
                type="button"
                variant="secondary"
              >
                Keep booking
              </Button>
              <Button
                className="button--danger"
                disabled={isCancelling}
                onClick={handleCancelBooking}
                type="button"
                variant="ghost"
              >
                {isCancelling ? 'Cancelling…' : 'Yes, cancel booking'}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  )
}
