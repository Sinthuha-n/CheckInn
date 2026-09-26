import { BedDouble, CheckCircle2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Container } from '../components/ui/Container'
import { adminRoomApi } from '../features/admin/adminRoomApi'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../services/apiClient'
import type { Room } from '../types/api'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)

export function AdminRoomsPage() {
  const { session } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState(0)

  useEffect(() => {
    if (!session) return

    let active = true
    adminRoomApi.list(session.token)
      .then((result) => {
        if (active) setRooms(result)
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setError(
            caughtError instanceof ApiError
              ? caughtError.message
              : 'Room inventory could not be loaded. Please try again.',
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
    const available = rooms.filter((room) => room.available).length
    return {
      total: rooms.length,
      available,
      unavailable: rooms.length - available,
    }
  }, [rooms])

  const retryInventory = () => {
    setIsLoading(true)
    setError('')
    setRequestKey((key) => key + 1)
  }

  return (
    <section className="admin-page" aria-labelledby="admin-rooms-title">
      <Container>
        <div className="admin-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Operations desk</p>
            <h1 id="admin-rooms-title">Room inventory</h1>
          </div>
          <p>A live overview of every room currently configured in CheckInn.</p>
        </div>

        {!isLoading && !error ? (
          <dl
            aria-label={`${summary.total} total rooms, ${summary.available} available, ${summary.unavailable} unavailable`}
            className="admin-summary"
          >
            <div>
              <dt>Total rooms</dt>
              <dd>{summary.total}</dd>
            </div>
            <div>
              <dt>Available</dt>
              <dd>{summary.available}</dd>
            </div>
            <div>
              <dt>Unavailable</dt>
              <dd>{summary.unavailable}</dd>
            </div>
          </dl>
        ) : null}

        {isLoading ? (
          <div className="admin-state" role="status">
            <BedDouble aria-hidden="true" size={24} />
            Loading room inventory…
          </div>
        ) : null}

        {error ? (
          <div className="admin-state admin-state--error" role="alert">
            <p>{error}</p>
            <button className="button button--secondary" onClick={retryInventory} type="button">
              <RefreshCw aria-hidden="true" size={17} />
              Try again
            </button>
          </div>
        ) : null}

        {!isLoading && !error && rooms.length === 0 ? (
          <div className="admin-state">
            <BedDouble aria-hidden="true" size={26} />
            <h2>No rooms configured.</h2>
            <p>Rooms will appear here when they are added to CheckInn.</p>
          </div>
        ) : null}

        {!isLoading && !error && rooms.length > 0 ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <caption>Configured CheckInn rooms</caption>
              <thead>
                <tr>
                  <th scope="col">Room</th>
                  <th scope="col">Type and description</th>
                  <th scope="col">Capacity</th>
                  <th scope="col">Nightly rate</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id}>
                    <td data-label="Room"><strong>{room.roomNumber}</strong></td>
                    <td data-label="Type and description">
                      <strong>{room.roomType}</strong>
                      <span>{room.description}</span>
                    </td>
                    <td data-label="Capacity">{room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}</td>
                    <td data-label="Nightly rate">{formatPrice(room.pricePerNight)}</td>
                    <td data-label="Status">
                      <span className={room.available ? 'admin-status admin-status--available' : 'admin-status admin-status--unavailable'}>
                        {room.available ? <CheckCircle2 aria-hidden="true" size={15} /> : <XCircle aria-hidden="true" size={15} />}
                        {room.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Container>
    </section>
  )
}

