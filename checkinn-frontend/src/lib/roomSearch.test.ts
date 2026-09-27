import {
  getNextIsoDate,
  MAX_ROOMS,
  MAX_SINGLE_ROOM_GUESTS,
  MAX_TOTAL_GUESTS,
  parseRoomSearch,
  serializeRoomSearch,
  toLocalIsoDate,
  validateRoomSearch,
} from './roomSearch'

describe('room search helpers', () => {
  const today = '2026-09-25'

  it('formats local dates without applying a UTC offset', () => {
    expect(toLocalIsoDate(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05')
    expect(getNextIsoDate('2026-12-31')).toBe('2027-01-01')
  })

  it('reports required dates and a non-positive guest count', () => {
    expect(
      validateRoomSearch(
        { checkIn: '', checkOut: '', guests: 0, rooms: 0 },
        today,
      ),
    ).toEqual({
      checkIn: 'Choose a check-in date',
      checkOut: 'Choose a check-out date',
      guests: 'Guests must be a whole number of at least 1',
      rooms: 'Rooms must be a whole number of at least 1',
    })
  })

  it('rejects a past check-in and checkout that is not later', () => {
    expect(
      validateRoomSearch(
        {
          checkIn: '2026-09-24',
          checkOut: '2026-09-24',
          guests: 2,
          rooms: 1,
        },
        today,
      ),
    ).toEqual({
      checkIn: 'Check-in cannot be in the past',
      checkOut: 'Check-out must be after check-in',
    })
  })

  it.each([
    { guests: 0, message: 'Guests must be a whole number of at least 1' },
    { guests: 1.5, message: 'Guests must be a whole number of at least 1' },
    {
      guests: MAX_TOTAL_GUESTS + 1,
      message: 'A search can include up to 40 guests',
    },
  ])('rejects an unsupported guest count of $guests', ({ guests, message }) => {
    expect(
      validateRoomSearch(
        {
          checkIn: '2026-10-03',
          checkOut: '2026-10-06',
          guests,
          rooms: 1,
        },
        today,
      ).guests,
    ).toBe(message)
  })

  it.each([
    {
      guests: 2,
      rooms: 0,
      message: 'Rooms must be a whole number of at least 1',
    },
    {
      guests: 2,
      rooms: 1.5,
      message: 'Rooms must be a whole number of at least 1',
    },
    {
      guests: 6,
      rooms: MAX_ROOMS + 1,
      message: 'A search can include up to 5 rooms',
    },
    {
      guests: 2,
      rooms: 3,
      message: 'Rooms cannot exceed the number of guests',
    },
    {
      guests: MAX_SINGLE_ROOM_GUESTS + 1,
      rooms: 1,
      message: '9 guests require at least 2 rooms',
    },
  ])(
    'rejects an unsupported $guests guest and $rooms room combination',
    ({ guests, rooms, message }) => {
      expect(
        validateRoomSearch(
          {
            checkIn: '2026-10-03',
            checkOut: '2026-10-06',
            guests,
            rooms,
          },
          today,
        ).rooms,
      ).toBe(message)
    },
  )

  it('serializes a valid search in the public URL contract order', () => {
    expect(
      serializeRoomSearch({
        checkIn: '2026-10-03',
        checkOut: '2026-10-06',
        guests: 3,
        rooms: 2,
      }),
    ).toBe('checkIn=2026-10-03&checkOut=2026-10-06&guests=3&rooms=2')
  })

  it('defaults legacy search URLs to one room', () => {
    expect(
      parseRoomSearch(
        '?checkIn=2026-10-03&checkOut=2026-10-06&guests=3',
      ),
    ).toEqual({
      checkIn: '2026-10-03',
      checkOut: '2026-10-06',
      guests: 3,
      rooms: 1,
    })
  })
})
