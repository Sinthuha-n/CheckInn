import { createSession, createToken } from '../../test/authFixtures'
import { authStorage, isTokenExpired } from './authStorage'

describe('authStorage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('restores a valid session', () => {
    const session = createSession()
    authStorage.write(session)

    expect(authStorage.read()).toEqual(session)
  })

  it('removes expired sessions', () => {
    authStorage.write(createSession('USER', Date.now() - 1_000))

    expect(authStorage.read()).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('rejects malformed session values', () => {
    sessionStorage.setItem('checkinn.session', '{not-valid-json')

    expect(authStorage.read()).toBeNull()
    expect(sessionStorage.length).toBe(0)
  })

  it('treats tokens without a valid expiry as expired', () => {
    expect(isTokenExpired('invalid-token')).toBe(true)
    expect(isTokenExpired(createToken(Date.now() + 60_000))).toBe(false)
  })
})
