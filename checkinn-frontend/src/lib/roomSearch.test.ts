import {
  getNextIsoDate,
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
      validateRoomSearch({ checkIn: '', checkOut: '', guests: 0 }, today),
    ).toEqual({
      checkIn: 'Choose a check-in date',
      checkOut: 'Choose a check-out date',
      guests: 'Guests must be a whole number of at least 1',
    })
  })

  it('rejects a past check-in and checkout that is not later', () => {
    expect(
      validateRoomSearch(
        { checkIn: '2026-09-24', checkOut: '2026-09-24', guests: 2 },
        today,
      ),
    ).toEqual({
      checkIn: 'Check-in cannot be in the past',
      checkOut: 'Check-out must be after check-in',
    })
  })

  it('serializes a valid search in the public URL contract order', () => {
    expect(
      serializeRoomSearch({
        checkIn: '2026-10-03',
        checkOut: '2026-10-06',
        guests: 3,
      }),
    ).toBe('checkIn=2026-10-03&checkOut=2026-10-06&guests=3')
  })
})
