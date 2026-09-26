import { KeyRound, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { flushSync } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import { Container } from '../ui/Container'
import { UserMenu } from './UserMenu'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  `nav-link${isActive ? ' nav-link--active' : ''}`

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { isAuthenticated, logout, session } = useAuth()
  const navigate = useNavigate()

  const closeMenu = () => setIsMenuOpen(false)

  const handleLogout = () => {
    flushSync(logout)
    navigate('/', { replace: true, flushSync: true })
    closeMenu()
  }

  return (
    <header className="site-header">
      <Container className="site-header__inner">
        <NavLink
          className="brand"
          onClick={closeMenu}
          to="/"
          aria-label="CheckInn home"
        >
          <span className="brand__mark" aria-hidden="true">
            <KeyRound size={17} strokeWidth={1.8} />
          </span>
          <span>CheckInn</span>
        </NavLink>

        <button
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
          className="nav-toggle"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav
          aria-label="Primary navigation"
          className={`site-nav${isMenuOpen ? ' site-nav--open' : ''}`}
          id="primary-navigation"
        >
          <NavLink className={navClassName} onClick={closeMenu} to="/" end>
            Home
          </NavLink>

          {isAuthenticated ? (
            <>
              <NavLink className={navClassName} onClick={closeMenu} to="/rooms">
                Find a room
              </NavLink>
              {session ? (
                <UserMenu
                  onLogout={handleLogout}
                  onNavigate={closeMenu}
                  session={session}
                />
              ) : null}
            </>
          ) : (
            <>
              <NavLink className={navClassName} onClick={closeMenu} to="/login">
                Sign in
              </NavLink>
              <NavLink className="nav-cta" onClick={closeMenu} to="/register">
                Create account
              </NavLink>
            </>
          )}
        </nav>
      </Container>
    </header>
  )
}
