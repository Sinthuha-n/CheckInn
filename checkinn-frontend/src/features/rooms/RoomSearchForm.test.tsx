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

  it('starts at one guest and one room with accessible steppers', async () => {
    authStorage.write(createSession())
    const user = userEvent.setup()
    renderApp('/find-your-stay')

    const guestInput = screen.getByLabelText('Guests')
    const roomInput = screen.getByLabelText('Rooms')
    const decreaseButton = screen.getByRole('button', {
      name: 'Decrease guests',
    })
    const increaseButton = screen.getByRole('button', {
      name: 'Increase guests',
    })
    const decreaseRooms = screen.getByRole('button', {
      name: 'Decrease rooms',
    })
    const increaseRooms = screen.getByRole('button', {
      name: 'Increase rooms',
    })

    expect(guestInput).toHaveValue(1)
    expect(roomInput).toHaveValue(1)
    expect(screen.getByText('guest')).toBeInTheDocument()
    expect(screen.getByText('room')).toBeInTheDocument()
    expect(decreaseButton).toBeDisabled()
    expect(decreaseRooms).toBeDisabled()
    expect(increaseRooms).toBeDisabled()

    await user.click(increaseButton)

    expect(guestInput).toHaveValue(2)
    expect(screen.getByText('guests')).toBeInTheDocument()
    expect(decreaseButton).toBeEnabled()

    await user.clear(guestInput)
    await user.type(guestInput, '40')

    expect(increaseButton).toBeDisabled()
    expect(roomInput).toHaveValue(5)
    await user.click(decreaseButton)
    expect(guestInput).toHaveValue(39)
    expect(roomInput).toHaveValue(5)
  })

  it('automatically adds capacity and allows extra rooms without empty rooms', async () => {
    authStorage.write(createSession())
    const user = userEvent.setup()
    renderApp('/find-your-stay')

    const guestInput = screen.getByLabelText('Guests')
    const roomInput = screen.getByLabelText('Rooms')
    await user.clear(guestInput)
    await user.type(guestInput, '9')

    expect(roomInput).toHaveValue(2)
    expect(screen.getByRole('button', { name: 'Decrease rooms' })).toBeDisabled()

    await user.clear(guestInput)
    await user.type(guestInput, '6')
    expect(roomInput).toHaveValue(2)

    await user.click(screen.getByRole('button', { name: 'Increase rooms' }))
    expect(roomInput).toHaveValue(3)

    await user.clear(guestInput)
    await user.type(guestInput, '1')
    expect(roomInput).toHaveValue(1)
  })

  it('shows accessible inline validation for an incomplete search', async () => {
    authStorage.write(createSession())
    const user = userEvent.setup()
    renderApp('/find-your-stay')

    await user.clear(screen.getByLabelText('Guests'))
    await user.clear(screen.getByLabelText('Rooms'))
    await user.click(screen.getByRole('button', { name: /find rooms/i }))

    expect(screen.getByText('Choose a check-in date')).toBeInTheDocument()
    expect(screen.getByText('Choose a check-out date')).toBeInTheDocument()
    expect(
      screen.getByText('Guests must be a whole number of at least 1'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Rooms must be a whole number of at least 1'),
    ).toBeInTheDocument()
    expect(screen.getAllByRole('alert')).toHaveLength(4)
    expect(screen.getByLabelText('Check-in')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
  })

  it('rejects invalid direct room combinations and excessive guest counts', async () => {
    authStorage.write(createSession())
    const user = userEvent.setup()
    renderApp('/find-your-stay')

    const guestInput = screen.getByLabelText('Guests')
    const roomInput = screen.getByLabelText('Rooms')
    await user.clear(guestInput)
    await user.type(guestInput, '9')
    expect(roomInput).toHaveValue(2)
    await user.clear(roomInput)
    await user.type(roomInput, '1')
    await user.click(screen.getByRole('button', { name: /find rooms/i }))

    expect(
      screen.getByText('9 guests require at least 2 rooms'),
    ).toBeInTheDocument()
    expect(roomInput).toHaveAttribute('aria-invalid', 'true')

    await user.clear(guestInput)
    await user.type(guestInput, '41')
    await user.click(screen.getByRole('button', { name: /find rooms/i }))
    expect(
      screen.getByText('A search can include up to 40 guests'),
    ).toBeInTheDocument()
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
      '?checkIn=2030-06-12&checkOut=2030-06-15&guests=3&rooms=1',
    )
  })
})
