import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { authStorage } from '../features/auth/authStorage'
import { createSession } from '../test/authFixtures'
import { renderApp } from '../test/renderApp'

describe('CheckInn application', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders the landing page inside the shared application layout', () => {
    renderApp()

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /the journey begins before check-in/i,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('banner')).toBeInTheDocument()
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: /primary navigation/i }),
    ).toBeInTheDocument()
  })

  it('offers a keyboard-accessible skip link', () => {
    renderApp()

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main-content',
    )
  })

  it('exposes an accessible navigation toggle', async () => {
    const user = userEvent.setup()
    renderApp()
    const toggle = screen.getByRole('button', { name: /open navigation/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(
      screen.getByRole('button', { name: /close navigation/i }),
    ).toHaveAttribute('aria-expanded', 'true')
  })

  it('sends signed-out guests from the primary action to sign in', async () => {
    const user = userEvent.setup()
    const { router } = renderApp()

    await user.click(screen.getByRole('link', { name: /plan your stay/i }))

    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/rooms' })
    expect(
      screen.queryByRole('search', { name: /search available rooms/i }),
    ).not.toBeInTheDocument()
  })

  it('sends authenticated guests directly to Find Your Stay', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession())
    const { router } = renderApp()

    await user.click(screen.getByRole('link', { name: /plan your stay/i }))

    expect(router.state.location.pathname).toBe('/rooms')
    expect(
      screen.getByRole('heading', { name: /your room search starts here/i }),
    ).toBeInTheDocument()
  })

  it('renders the branded not-found route and returns home', async () => {
    const user = userEvent.setup()
    renderApp('/a-room-that-does-not-exist')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /this room is not on the itinerary/i,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: /return home/i }))

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: /the journey begins before check-in/i,
      }),
    ).toBeInTheDocument()
  })
})
