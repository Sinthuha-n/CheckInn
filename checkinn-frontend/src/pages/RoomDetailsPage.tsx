import { ArrowLeft, ArrowRight, BedDouble, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Container } from '../components/ui/Container'
import { useAuth } from '../features/auth/useAuth'
import { roomApi } from '../features/rooms/roomApi'
import { parseRoomSearch } from '../lib/roomSearch'
import { ApiError } from '../services/apiClient'
import type { Room } from '../types/api'

export function RoomDetailsPage() {
  const { roomId } = useParams()
  const location = useLocation()
  const { session } = useAuth()
  const search = parseRoomSearch(location.search)
  const numericRoomId = Number(roomId)
  const invalidRoomId = !Number.isInteger(numericRoomId)
  const [room, setRoom] = useState<Room | null>(null)
  const [error, setError] = useState('')

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

  const displayError = invalidRoomId ? 'This room could not be found.' : error

  return (
    <section className="booking-page" aria-labelledby="room-details-title">
      <Container size="narrow">
        <Link className="text-link" to={search ? `/rooms${location.search}` : '/find-your-stay'}>
          <ArrowLeft aria-hidden="true" size={17} />
          {search ? 'Back to available rooms' : 'Find your stay'}
        </Link>

        {displayError ? <p className="booking-status booking-status--error" role="alert">{displayError}</p> : null}
        {!room && !displayError ? <p className="booking-status" role="status">Preparing room details…</p> : null}

        {room ? (
          <article className="room-detail">
            <p className="eyebrow eyebrow--dark">Room {room.roomNumber}</p>
            <h1 id="room-details-title">{room.roomType}</h1>
            <p className="room-detail__description">{room.description}</p>
            <div className="room-detail__facts">
              <div><BedDouble aria-hidden="true" size={20} /><span>Room type<strong>{room.roomType}</strong></span></div>
              <div><Users aria-hidden="true" size={20} /><span>Capacity<strong>Up to {room.capacity} guests</strong></span></div>
              <div><span className="room-detail__currency">LKR</span><span>Nightly rate<strong>{room.pricePerNight.toLocaleString()}</strong></span></div>
            </div>
            <div className="room-detail__actions">
              <Link className="button button--primary button--large" to={search ? `/rooms/${room.id}/book${location.search}` : '/find-your-stay'}>
                {search ? 'Continue to booking' : 'Choose stay dates'}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
            </div>
          </article>
        ) : null}
      </Container>
    </section>
  )
}
