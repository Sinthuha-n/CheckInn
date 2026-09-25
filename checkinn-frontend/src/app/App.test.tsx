import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('links the primary action to the room search', () => {
    renderApp()

    expect(screen.getByRole('link', { name: /plan your stay/i })).toHaveAttribute(
      'href',
      '#stay-search',
    )
    expect(
      screen.getByRole('search', { name: /search available rooms/i }),
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
