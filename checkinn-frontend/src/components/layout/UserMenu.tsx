import { ChevronDown, DoorOpen, LogOut, ShieldCheck } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { LoginResponse } from '../../types/api'

interface UserMenuProps {
  onLogout: () => void
  onNavigate: () => void
  session: LoginResponse
}

export function UserMenu({ onLogout, onNavigate, session }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [isOpen])

  const closeMenu = () => {
    setIsOpen(false)
    onNavigate()
  }

  return (
    <div
      className="user-menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false)
          triggerRef.current?.focus()
        }
      }}
      ref={rootRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="user-menu__trigger"
        onClick={() => setIsOpen((open) => !open)}
        ref={triggerRef}
        type="button"
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {session.name.charAt(0).toUpperCase()}
        </span>
        <span className="user-menu__trigger-copy">
          <span>{session.name}</span>
          <small>Guest profile</small>
        </span>
        <ChevronDown aria-hidden="true" size={16} />
      </button>

      {isOpen ? (
        <div className="user-menu__panel" id={menuId}>
          <div className="user-menu__summary">
            <strong>{session.name}</strong>
            <span>{session.email}</span>
          </div>
          <nav aria-label="Account navigation">
            <NavLink onClick={closeMenu} to="/rooms">
              <DoorOpen aria-hidden="true" size={17} />
              Find a room
            </NavLink>
            {session.role === 'ADMIN' ? (
              <NavLink onClick={closeMenu} to="/admin">
                <ShieldCheck aria-hidden="true" size={17} />
                Admin workspace
              </NavLink>
            ) : null}
          </nav>
          <button className="user-menu__logout" onClick={onLogout} type="button">
            <LogOut aria-hidden="true" size={17} />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
