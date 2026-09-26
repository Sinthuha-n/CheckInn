import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSession, jsonResponse } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import { authStorage } from './authStorage'

describe('authentication routes', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('redirects anonymous visitors from a protected route to login', async () => {
    renderApp('/rooms?guests=2')

    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
  })

  it.each([
    '/find-your-stay',
    '/rooms',
    '/rooms/7',
    '/rooms/7/book',
    '/bookings/18/confirmation',
    '/my-bookings',
  ])('protects %s from anonymous visitors', async (path) => {
    const { router } = renderApp(path)

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: path })
  })

  it('signs in and returns to the protected destination', async () => {
    const user = userEvent.setup()
    const session = createSession()
    vi.mocked(fetch).mockResolvedValue(jsonResponse(session))
    const { router } = renderApp(
      '/rooms?checkIn=2030-06-12&checkOut=2030-06-15&guests=3',
    )

    await user.type(screen.getByLabelText(/email address/i), session.email)
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByRole('heading', {
        name: /a room for the way you travel/i,
      }),
    ).toBeInTheDocument()
    expect(authStorage.read()).toEqual(session)
    expect(screen.getByText(session.name)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/rooms')
    expect(router.state.location.search).toBe(
      '?checkIn=2030-06-12&checkOut=2030-06-15&guests=3',
    )
  })

  it('shows backend validation errors on the matching field', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ email: 'Invalid email format' }, 400),
    )
    renderApp('/login')

    await user.type(screen.getByLabelText(/email address/i), 'valid@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email format')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('validates required login fields before calling the API', async () => {
    const user = userEvent.setup()
    renderApp('/login')

    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('disables the login form while authentication is pending', async () => {
    const user = userEvent.setup()
    const session = createSession()
    let resolveLogin!: (response: Response) => void
    const pendingLogin = new Promise<Response>((resolve) => {
      resolveLogin = resolve
    })
    vi.mocked(fetch).mockReturnValue(pendingLogin)
    renderApp('/login')

    await user.type(screen.getByLabelText(/email address/i), session.email)
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled()
    expect(screen.getByLabelText(/email address/i)).toBeDisabled()
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled()

    resolveLogin(jsonResponse(session))
    expect(
      await screen.findByRole('heading', {
        name: /where will you rest next/i,
      }),
    ).toBeInTheDocument()
  })

  it('validates matching registration passwords before calling the API', async () => {
    const user = userEvent.setup()
    renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(
      screen.getByLabelText(/^confirm password$/i),
      'Different123!',
    )
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Passwords must match')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('registers, signs in, and returns to the intended destination', async () => {
    const user = userEvent.setup()
    const session = createSession()
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          id: 3,
          name: 'Avery Guest',
          email: 'avery@example.com',
          role: 'USER',
        }),
      )
      .mockResolvedValueOnce(jsonResponse(session))
    const { router } = renderApp(
      '/rooms?checkIn=2030-06-12&checkOut=2030-06-15&guests=2#results',
    )

    await user.click(screen.getByRole('link', { name: /create an account/i }))
    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByRole('heading', {
        name: /a room for the way you travel/i,
      }),
    ).toBeInTheDocument()
    expect(authStorage.read()).toEqual(session)
    expect(router.state.location.pathname).toBe('/rooms')
    expect(router.state.location.search).toBe(
      '?checkIn=2030-06-12&checkOut=2030-06-15&guests=2',
    )
    expect(router.state.location.hash).toBe('#results')
  })

  it('returns to sign in when automatic login fails after registration', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        jsonResponse({
          id: 3,
          name: 'Avery Guest',
          email: 'avery@example.com',
          role: 'USER',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ message: 'Invalid email or password' }, 400),
      )
    const { router } = renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(/your account is ready/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      'avery@example.com',
    )
    expect(router.state.location.state).toEqual({
      email: 'avery@example.com',
      from: '/find-your-stay',
      registrationComplete: true,
    })
  })

  it('reports duplicate registration errors without attempting login', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ message: 'Email already registered' }, 409),
    )
    renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/^confirm password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Email already registered')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('restores sessions, closes the profile with Escape, and signs out locally', async () => {
    const user = userEvent.setup()
    const session = createSession('USER')
    authStorage.write(session)
    const { router } = renderApp('/rooms')

    const profileButton = screen.getByRole('button', { name: /avery guest/i })
    await user.click(profileButton)
    expect(screen.getByText(session.email)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByText(session.email)).not.toBeInTheDocument()
    expect(profileButton).toHaveFocus()

    await user.click(profileButton)
    await user.click(screen.getByRole('button', { name: /sign out/i }))

    expect(
      await screen.findByRole('heading', {
        name: /the journey begins before check-in/i,
      }),
    ).toBeInTheDocument()
    expect(authStorage.read()).toBeNull()

    await act(async () => {
      await router.navigate('/rooms')
    })
    expect(
      await screen.findByRole('heading', { name: /welcome back/i }),
    ).toBeInTheDocument()
  })

  it('allows administrators to reach admin from the profile menu', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('ADMIN'))
    renderApp('/rooms')

    await user.click(screen.getByRole('button', { name: /admin guest/i }))
    await user.click(screen.getByRole('link', { name: /admin workspace/i }))

    expect(
      screen.getByRole('heading', { name: /operations desk is ready/i }),
    ).toBeInTheDocument()
  })
})
