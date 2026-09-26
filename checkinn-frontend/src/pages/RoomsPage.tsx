import { ArrowRight, BedDouble, RefreshCw, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { roomApi } from '../features/rooms/roomApi'
import { useAuth } from '../features/auth/useAuth'
import { parseRoomSearch } from '../lib/roomSearch'
import { ApiError } from '../services/apiClient'
import type { Room } from '../types/api'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)

export function RoomsPage() {
  const location = useLocation()
  const { session } = useAuth()
  const search = parseRoomSearch(location.search)
  const [rooms, setRooms] = useState<Room[]>([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(Boolean(search))
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    const activeSearch = parseRoomSearch(location.search)
    if (!activeSearch || !session) {
      return
    }

    let active = true

    roomApi
      .available(activeSearch, session.token)
      .then((result) => {
        if (active) {
          setRooms(
            result.filter(
              (room) => room.available && room.capacity >= activeSearch.guests,
            ),
          )
        }
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(
            caughtError instanceof ApiError
              ? caughtError.message
              : 'Available rooms could not be loaded. Please try again.',
          )
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [location.search, requestKey, session])

  const retrySearch = () => {
    setIsLoading(true)
    setError('')
    setRequestKey((key) => key + 1)
  }

  if (!search) {
    return (
      <section className="booking-page booking-page--centered">
        <Container size="narrow">
          <p className="eyebrow eyebrow--dark">Room discovery</p>
          <h1>Choose your stay details first.</h1>
          <p>Valid check-in, check-out, and guest details are required before rooms can be shown.</p>
          <Link className="button button--primary button--large" to="/find-your-stay">
            Start a room search
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </Container>
      </section>
    )
  }

  return (
    <section className="rooms-page" aria-labelledby="rooms-title">
      <Container>
        <div className="booking-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Available rooms</p>
            <h1 id="rooms-title">A room for the way you travel.</h1>
          </div>
          <div className="search-summary" aria-label="Current stay search">
            <span>{search.checkIn} → {search.checkOut}</span>
            <span>{search.guests} {search.guests === 1 ? 'guest' : 'guests'}</span>
            <Link to="/find-your-stay">Change search</Link>
          </div>
        </div>

        {isLoading ? <p className="booking-status" role="status">Finding available rooms…</p> : null}

        {error ? (
          <div className="booking-status booking-status--error" role="alert">
            <p>{error}</p>
            <button className="button button--secondary" onClick={retrySearch} type="button">
              <RefreshCw aria-hidden="true" size={17} />
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && rooms.length === 0 ? (
          <div className="booking-status">
            <h2>No rooms match this stay.</h2>
            <p>Try different dates or a smaller party size.</p>
            <Link className="button button--secondary" to="/find-your-stay">Change search</Link>
          </div>
        ) : null}

        {!isLoading && !error && rooms.length > 0 ? (
          <div className="room-grid">
            {rooms.map((room) => (
              <article className="room-card" key={room.id}>
                <div className="room-card__meta">
                  <span>Room {room.roomNumber}</span>
                  <span>{formatPrice(room.pricePerNight)} / night</span>
                </div>
                <h2>{room.roomType}</h2>
                <p>{room.description}</p>
                <div className="room-card__facts">
                  <span><Users aria-hidden="true" size={17} />Up to {room.capacity} guests</span>
                  <span><BedDouble aria-hidden="true" size={17} />Available</span>
                </div>
                <Link className="room-card__link" to={`/rooms/${room.id}${location.search}`}>
                  View room details
                  <ArrowRight aria-hidden="true" size={18} />
                </Link>
              </article>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  )
}
