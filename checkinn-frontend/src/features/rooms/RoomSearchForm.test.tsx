import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSession } from '../../test/authFixtures'
import { renderApp } from '../../test/renderApp'
import { authStorage } from '../auth/authStorage'

describe('authenticated room search', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  const completeSearch = async () => {
    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Check-in'), '2030-06-12')
    await user.type(screen.getByLabelText('Check-out'), '2030-06-15')
    await user.clear(screen.getByLabelText('Guests'))
    await user.type(screen.getByLabelText('Guests'), '3')
    return user
  }

  it('shows accessible inline validation for an incomplete search', async () => {
    authStorage.write(createSession())
    const user = userEvent.setup()
    renderApp('/find-your-stay')

    await user.clear(screen.getByLabelText('Guests'))
    await user.click(screen.getByRole('button', { name: /find a room/i }))

    expect(screen.getByText('Choose a check-in date')).toBeInTheDocument()
    expect(screen.getByText('Choose a check-out date')).toBeInTheDocument()
    expect(
      screen.getByText('Guests must be a whole number of at least 1'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(3)
    expect(screen.getByLabelText('Check-in')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('redirects anonymous visitors to sign in before showing search', async () => {
    const { router } = renderApp('/find-your-stay')

    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(router.state.location.state).toEqual({ from: '/find-your-stay' })
  })

  it('submits with the keyboard and keeps parameters for signed-in guests', async () => {
    authStorage.write(createSession())
    const { router } = renderApp('/find-your-stay')
    const user = await completeSearch()

    await user.type(screen.getByLabelText('Guests'), '{Enter}')

    expect(
      await screen.findByRole('heading', {
        name: /a room for the way you travel/i,
      }),
    ).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/rooms')
    expect(router.state.location.search).toBe(
      '?checkIn=2030-06-12&checkOut=2030-06-15&guests=3',
    )
  })
})
