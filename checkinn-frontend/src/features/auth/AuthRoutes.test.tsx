import { screen } from '@testing-library/react'
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

  it('signs in and returns to the protected destination', async () => {
    const user = userEvent.setup()
    const session = createSession()
    vi.mocked(fetch).mockResolvedValue(jsonResponse(session))
    renderApp('/rooms')

    await user.type(screen.getByLabelText(/email address/i), session.email)
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(
      await screen.findByRole('heading', {
        name: /your room search starts here/i,
      }),
    ).toBeInTheDocument()
    expect(authStorage.read()).toEqual(session)
    expect(screen.getByText(session.name)).toBeInTheDocument()
  })

  it('shows backend validation errors on the matching field', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({ email: 'Invalid email format' }, 400),
    )
    renderApp('/login')

    await user.type(screen.getByLabelText(/email address/i), 'invalid')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email format')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('validates matching registration passwords before calling the API', async () => {
    const user = userEvent.setup()
    renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Different123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByText('Passwords must match')).toBeInTheDocument()
    expect(fetch).not.toHaveBeenCalled()
  })

  it('registers an account and guides the user to login', async () => {
    const user = userEvent.setup()
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse({
        id: 3,
        name: 'Avery Guest',
        email: 'avery@example.com',
        role: 'USER',
      }),
    )
    renderApp('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Avery Guest')
    await user.type(screen.getByLabelText(/email address/i), 'avery@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'Password123!')
    await user.type(screen.getByLabelText(/confirm password/i), 'Password123!')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    expect(
      await screen.findByText(/your account is ready/i),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toHaveValue(
      'avery@example.com',
    )
  })

  it('restores sessions, enforces roles, and signs out locally', async () => {
    const user = userEvent.setup()
    authStorage.write(createSession('USER'))
    renderApp('/admin')

    expect(
      screen.getByRole('heading', { name: /this space is reserved/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /sign out/i }))
    expect(
      await screen.findByRole('heading', {
        name: /the journey begins before check-in/i,
      }),
    ).toBeInTheDocument()
    expect(authStorage.read()).toBeNull()
  })

  it('allows administrators into the protected admin destination', () => {
    authStorage.write(createSession('ADMIN'))
    renderApp('/admin')

    expect(
      screen.getByRole('heading', { name: /operations desk is ready/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument()
  })
})
