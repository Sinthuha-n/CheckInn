import { Plus, X } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Button } from '../../../components/ui/Button'
import type { Room } from '../../../types/api'
import type { RoomPayload } from '../adminRoomApi'

interface RoomFormModalProps {
  /** Pass a room to edit it, or undefined to create a new one */
  room?: Room
  isSubmitting: boolean
  onSubmit: (payload: RoomPayload) => void
  onClose: () => void
  children?: React.ReactNode
}

const ROOM_TYPES = [
  'Standard Room',
  'Deluxe Room',
  'Superior Room',
  'Suite',
  'Junior Suite',
  'Executive Suite',
  'Presidential Suite',
  'Family Room',
  'Connecting Room',
  'Studio Room',
]

function emptyForm(): RoomPayload {
  return {
    roomNumber: '',
    roomType: '',
    description: '',
    pricePerNight: 0,
    capacity: 1,
    available: true,
    bedConfiguration: '',
    amenities: [],
  }
}

function roomToPayload(room: Room): RoomPayload {
  return {
    roomNumber: room.roomNumber,
    roomType: room.roomType,
    description: room.description,
    pricePerNight: room.pricePerNight,
    capacity: room.capacity,
    available: room.available,
    bedConfiguration: room.bedConfiguration ?? '',
    amenities: [...room.amenities],
  }
}

export function RoomFormModal({ room, isSubmitting, onSubmit, onClose, children }: RoomFormModalProps) {
  const isEditing = room !== undefined
  const [form, setForm] = useState<RoomPayload>(() =>
    isEditing ? roomToPayload(room) : emptyForm(),
  )
  const [amenityInput, setAmenityInput] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof RoomPayload, string>>>({})
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Open native dialog + focus first field
  useEffect(() => {
    if (typeof dialogRef.current?.showModal === 'function') {
      dialogRef.current.showModal()
    }
    firstInputRef.current?.focus()
  }, [])

  // Close on backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target === dialogRef.current) {
      onClose()
    }
  }

  // Close on Escape key (dialog handles this natively, but we sync our state)
  useEffect(() => {
    const dialog = dialogRef.current
    const handleCancel = (event: Event) => {
      event.preventDefault()
      onClose()
    }
    dialog?.addEventListener('cancel', handleCancel)
    return () => dialog?.removeEventListener('cancel', handleCancel)
  }, [onClose])

  const setField = <K extends keyof RoomPayload>(key: K, value: RoomPayload[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  // Add an amenity chip when user presses Enter or comma, or clicks +
  const addAmenity = () => {
    const value = amenityInput.trim()
    if (!value || form.amenities.includes(value)) {
      setAmenityInput('')
      return
    }
    setField('amenities', [...form.amenities, value])
    setAmenityInput('')
  }

  const handleAmenityKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addAmenity()
    }
    if (event.key === 'Backspace' && amenityInput === '' && form.amenities.length > 0) {
      setField('amenities', form.amenities.slice(0, -1))
    }
  }

  const removeAmenity = (index: number) => {
    setField('amenities', form.amenities.filter((_, i) => i !== index))
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (!form.roomNumber.trim()) next.roomNumber = 'Room number is required'
    if (!form.roomType.trim()) next.roomType = 'Room type is required'
    if (!form.description.trim()) next.description = 'Description is required'
    if (!form.pricePerNight || form.pricePerNight <= 0) next.pricePerNight = 'Price must be greater than 0'
    if (!form.capacity || form.capacity < 1) next.capacity = 'Capacity must be at least 1'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    // Commit any pending amenity text before submitting
    const finalAmenities =
      amenityInput.trim() && !form.amenities.includes(amenityInput.trim())
        ? [...form.amenities, amenityInput.trim()]
        : form.amenities
    onSubmit({ ...form, amenities: finalAmenities })
  }

  return (
    <dialog
      className="room-modal"
      ref={dialogRef}
      open
      onClick={handleBackdropClick}
      aria-labelledby="room-modal-title"
      aria-modal="true"
    >
      <div className="room-modal__panel">
        {/* Header */}
        <div className="room-modal__header">
          <h2 id="room-modal-title">{isEditing ? 'Edit room' : 'Add a new room'}</h2>
          <button
            aria-label="Close dialog"
            className="room-modal__close"
            disabled={isSubmitting}
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form className="room-modal__form" noValidate onSubmit={handleSubmit}>
          {/* Row: room number + room type */}
          <div className="room-form-row">
            <div className="form-field">
              <label htmlFor="rf-roomNumber">Room number</label>
              <input
                disabled={isSubmitting}
                id="rf-roomNumber"
                onChange={e => setField('roomNumber', e.target.value)}
                placeholder="e.g. 101"
                ref={firstInputRef}
                type="text"
                value={form.roomNumber}
                aria-invalid={!!errors.roomNumber}
                aria-describedby={errors.roomNumber ? 'rf-roomNumber-error' : undefined}
              />
              {errors.roomNumber && (
                <p className="form-field__error" id="rf-roomNumber-error" role="alert">
                  {errors.roomNumber}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="rf-roomType">Room type</label>
              <select
                disabled={isSubmitting}
                id="rf-roomType"
                onChange={e => setField('roomType', e.target.value)}
                value={form.roomType}
                aria-invalid={!!errors.roomType}
                aria-describedby={errors.roomType ? 'rf-roomType-error' : undefined}
              >
                <option value="">Select type…</option>
                {ROOM_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.roomType && (
                <p className="form-field__error" id="rf-roomType-error" role="alert">
                  {errors.roomType}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="form-field">
            <label htmlFor="rf-description">Description</label>
            <textarea
              disabled={isSubmitting}
              id="rf-description"
              onChange={e => setField('description', e.target.value)}
              placeholder="Brief description of the room…"
              rows={3}
              value={form.description}
              aria-invalid={!!errors.description}
              aria-describedby={errors.description ? 'rf-description-error' : undefined}
            />
            {errors.description && (
              <p className="form-field__error" id="rf-description-error" role="alert">
                {errors.description}
              </p>
            )}
          </div>

          {/* Row: price + capacity */}
          <div className="room-form-row">
            <div className="form-field">
              <label htmlFor="rf-price">
                Price per night <small>(LKR)</small>
              </label>
              <input
                disabled={isSubmitting}
                id="rf-price"
                min={1}
                onChange={e => setField('pricePerNight', Number(e.target.value))}
                placeholder="e.g. 15000"
                step="0.01"
                type="number"
                value={form.pricePerNight || ''}
                aria-invalid={!!errors.pricePerNight}
                aria-describedby={errors.pricePerNight ? 'rf-price-error' : undefined}
              />
              {errors.pricePerNight && (
                <p className="form-field__error" id="rf-price-error" role="alert">
                  {errors.pricePerNight}
                </p>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="rf-capacity">Capacity (guests)</label>
              <input
                disabled={isSubmitting}
                id="rf-capacity"
                min={1}
                max={10}
                onChange={e => setField('capacity', Number(e.target.value))}
                type="number"
                value={form.capacity || ''}
                aria-invalid={!!errors.capacity}
                aria-describedby={errors.capacity ? 'rf-capacity-error' : undefined}
              />
              {errors.capacity && (
                <p className="form-field__error" id="rf-capacity-error" role="alert">
                  {errors.capacity}
                </p>
              )}
            </div>
          </div>

          {/* Bed configuration */}
          <div className="form-field">
            <label htmlFor="rf-bedConfig">
              Bed configuration <small>Optional</small>
            </label>
            <input
              disabled={isSubmitting}
              id="rf-bedConfig"
              onChange={e => setField('bedConfiguration', e.target.value)}
              placeholder="e.g. 1 King Bed"
              type="text"
              value={form.bedConfiguration}
            />
          </div>

          {/* Amenities chip input */}
          <div className="form-field">
            <label htmlFor="rf-amenity">
              Amenities <small>Optional</small>
            </label>
            <div className="chip-input" role="group" aria-label="Amenities">
              {form.amenities.map((amenity, index) => (
                <span className="chip" key={`${amenity}-${index}`}>
                  {amenity}
                  <button
                    aria-label={`Remove ${amenity}`}
                    disabled={isSubmitting}
                    onClick={() => removeAmenity(index)}
                    type="button"
                  >
                    <X aria-hidden="true" size={13} />
                  </button>
                </span>
              ))}
              <div className="chip-input__entry">
                <input
                  disabled={isSubmitting}
                  id="rf-amenity"
                  onChange={e => setAmenityInput(e.target.value)}
                  onKeyDown={handleAmenityKeyDown}
                  placeholder={form.amenities.length === 0 ? 'e.g. Wi-Fi, Air conditioning…' : 'Add more…'}
                  type="text"
                  value={amenityInput}
                />
                <button
                  aria-label="Add amenity"
                  disabled={isSubmitting || !amenityInput.trim()}
                  onClick={addAmenity}
                  type="button"
                >
                  <Plus aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
            <p className="form-field__hint">Press Enter or comma to add each amenity.</p>
          </div>

          {/* Availability toggle */}
          <label className="room-form-toggle">
            <input
              checked={form.available}
              disabled={isSubmitting}
              onChange={e => setField('available', e.target.checked)}
              type="checkbox"
            />
            <span>Room is available for booking</span>
          </label>

          {/* Server-side error (injected by parent) */}
          {children}

          {/* Footer actions */}
          <div className="room-modal__actions">
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
            <Button disabled={isSubmitting} size="large" type="submit">
              {isSubmitting
                ? isEditing ? 'Saving…' : 'Creating…'
                : isEditing ? 'Save changes' : 'Create room'}
            </Button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
