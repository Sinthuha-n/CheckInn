import { getSafeAuthDestination } from './authRedirect'

describe('authentication destinations', () => {
  it('preserves safe internal paths, queries, and hashes', () => {
    expect(
      getSafeAuthDestination('/rooms?checkIn=2030-06-12&guests=2#results'),
    ).toBe('/rooms?checkIn=2030-06-12&guests=2#results')
    expect(getSafeAuthDestination('/admin')).toBe('/admin')
  })

  it.each([
    undefined,
    '',
    'https://example.com',
    '//example.com/rooms',
    '/\\example.com/rooms',
    '/login',
    '/login/',
    '/register?from=/admin',
  ])('falls back for unsafe or inappropriate destination %s', (destination) => {
    expect(getSafeAuthDestination(destination)).toBe('/rooms')
  })
})
