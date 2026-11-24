import {
  BedDouble,
  CheckCircle2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Container } from '../components/ui/Container'
import { RoomFormModal } from '../features/admin/components/RoomFormModal'
import { adminRoomApi, type RoomPayload } from '../features/admin/adminRoomApi'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../services/apiClient'
import type { Room } from '../types/api'

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-LK', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0,
  }).format(value)

type ModalMode =
  | { type: 'create' }
  | { type: 'edit'; room: Room }
  | { type: 'delete'; room: Room }
  | null

export function AdminRoomsPage() {
  const { session } = useAuth()
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [requestKey, setRequestKey] = useState(0)
  const [modal, setModal] = useState<ModalMode>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')

  // ── Load rooms ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session) return

    let active = true
    setIsLoading(true)
    setError('')

    adminRoomApi
      .list(session.token)
      .then(result => {
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
    const available = rooms.filter(r => r.available).length
    return { total: rooms.length, available, unavailable: rooms.length - available }
  }, [rooms])

  const retryInventory = () => {
    setRequestKey(k => k + 1)
  }

  const closeModal = () => {
    setModal(null)
    setActionError('')
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (payload: RoomPayload) => {
    if (!session) return
    setIsSubmitting(true)
    setActionError('')
    try {
      const created = await adminRoomApi.create(payload, session.token)
      setRooms(prev => [...prev, created])
      closeModal()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'The room could not be created. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleEdit = async (payload: RoomPayload) => {
    if (!session || modal?.type !== 'edit') return
    const roomId = modal.room.id
    setIsSubmitting(true)
    setActionError('')
    try {
      const updated = await adminRoomApi.update(roomId, payload, session.token)
      setRooms(prev => prev.map(r => (r.id === updated.id ? updated : r)))
      closeModal()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'The room could not be updated. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!session || modal?.type !== 'delete') return
    const roomId = modal.room.id
    setIsSubmitting(true)
    setActionError('')
    try {
      await adminRoomApi.deleteRoom(roomId, session.token)
      setRooms(prev => prev.filter(r => r.id !== roomId))
      closeModal()
    } catch (caughtError) {
      setActionError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'The room could not be deleted. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="admin-page" aria-labelledby="admin-rooms-title">
      <Container>
        {/* ── Heading ── */}
        <div className="admin-heading">
          <div>
            <p className="eyebrow eyebrow--dark">Operations desk</p>
            <h1 id="admin-rooms-title">Room inventory</h1>
          </div>
          <Button onClick={() => setModal({ type: 'create' })} size="large">
            <Plus aria-hidden="true" size={18} />
            Add room
          </Button>
        </div>

        {/* ── Summary stats ── */}
        {!isLoading && !error ? (
          <dl
            aria-label={`${summary.total} total, ${summary.available} available, ${summary.unavailable} unavailable`}
            className="admin-summary"
          >
            <div><dt>Total rooms</dt><dd>{summary.total}</dd></div>
            <div><dt>Available</dt><dd>{summary.available}</dd></div>
            <div><dt>Unavailable</dt><dd>{summary.unavailable}</dd></div>
          </dl>
        ) : null}

        {/* ── Loading ── */}
        {isLoading ? (
          <div className="admin-state" role="status">
            <BedDouble aria-hidden="true" size={24} />
            Loading room inventory…
          </div>
        ) : null}

        {/* ── Load error ── */}
        {error ? (
          <div className="admin-state admin-state--error" role="alert">
            <p>{error}</p>
            <button className="button button--secondary" onClick={retryInventory} type="button">
              <RefreshCw aria-hidden="true" size={17} />
              Try again
            </button>
          </div>
        ) : null}

        {/* ── Empty ── */}
        {!isLoading && !error && rooms.length === 0 ? (
          <div className="admin-state">
            <BedDouble aria-hidden="true" size={26} />
            <h2>No rooms configured.</h2>
            <p>Rooms will appear here when they are added to CheckInn.</p>
            <Button onClick={() => setModal({ type: 'create' })}>
              <Plus aria-hidden="true" size={17} />
              Add the first room
            </Button>
          </div>
        ) : null}

        {/* ── Table ── */}
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
                  <th scope="col"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td data-label="Room"><strong>{room.roomNumber}</strong></td>
                    <td data-label="Type and description">
                      <strong>{room.roomType}</strong>
                      <span>{room.description}</span>
                    </td>
                    <td data-label="Capacity">
                      {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
                    </td>
                    <td data-label="Nightly rate">{formatPrice(room.pricePerNight)}</td>
                    <td data-label="Status">
                      <span
                        className={
                          room.available
                            ? 'admin-status admin-status--available'
                            : 'admin-status admin-status--unavailable'
                        }
                      >
                        {room.available
                          ? <CheckCircle2 aria-hidden="true" size={15} />
                          : <XCircle aria-hidden="true" size={15} />}
                        {room.available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td data-label="Actions" className="admin-table__actions">
                      <button
                        aria-label={`Edit room ${room.roomNumber}`}
                        className="admin-action-btn admin-action-btn--edit"
                        onClick={() => setModal({ type: 'edit', room })}
                        type="button"
                      >
                        <Pencil aria-hidden="true" size={15} />
                        Edit
                      </button>
                      <button
                        aria-label={`Delete room ${room.roomNumber}`}
                        className="admin-action-btn admin-action-btn--delete"
                        onClick={() => setModal({ type: 'delete', room })}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" size={15} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Container>

      {/* ── Create modal ── */}
      {modal?.type === 'create' ? (
        <RoomFormModal
          isSubmitting={isSubmitting}
          onClose={closeModal}
          onSubmit={handleCreate}
        >
          {actionError ? (
            <p className="form-notice form-notice--error" role="alert">
              {actionError}
            </p>
          ) : null}
        </RoomFormModal>
      ) : null}

      {/* ── Edit modal ── */}
      {modal?.type === 'edit' ? (
        <RoomFormModal
          isSubmitting={isSubmitting}
          onClose={closeModal}
          onSubmit={handleEdit}
          room={modal.room}
        >
          {actionError ? (
            <p className="form-notice form-notice--error" role="alert">
              {actionError}
            </p>
          ) : null}
        </RoomFormModal>
      ) : null}

      {/* ── Delete confirmation dialog ── */}
      {modal?.type === 'delete' ? (
        <dialog
          aria-labelledby="delete-confirm-title"
          aria-modal="true"
          className="confirm-modal"
          open
        >
          <div className="confirm-modal__panel">
            <Trash2 aria-hidden="true" size={28} />
            <h2 id="delete-confirm-title">Delete room {modal.room.roomNumber}?</h2>
            <p>
              This will permanently remove <strong>{modal.room.roomType}</strong> (room{' '}
              {modal.room.roomNumber}) from CheckInn. This action cannot be undone.
            </p>
            {actionError ? (
              <p className="form-notice form-notice--error" role="alert">
                {actionError}
              </p>
            ) : null}
            <div className="confirm-modal__actions">
              <Button
                disabled={isSubmitting}
                onClick={closeModal}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                className="button--danger"
                disabled={isSubmitting}
                onClick={handleDelete}
                type="button"
                variant="ghost"
              >
                <Trash2 aria-hidden="true" size={16} />
                {isSubmitting ? 'Deleting…' : 'Yes, delete room'}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
    </section>
  )
}
