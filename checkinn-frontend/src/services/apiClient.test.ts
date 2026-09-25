import { authStorage } from '../features/auth/authStorage'
import { createSession, jsonResponse } from '../test/authFixtures'
import { ApiError, apiRequest } from './apiClient'

describe('apiRequest', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('serializes JSON and attaches a bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    vi.stubGlobal('fetch', fetchMock)

    await apiRequest<{ ok: boolean }>('/test', {
      method: 'POST',
      body: { value: 1 },
      token: 'jwt-token',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/test',
      expect.objectContaining({ method: 'POST', body: '{"value":1}' }),
    )
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(new Headers(request.headers).get('Authorization')).toBe(
      'Bearer jwt-token',
    )
  })

  it('normalizes backend field validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ email: 'Invalid email format' }, 400),
      ),
    )

    await expect(apiRequest('/test')).rejects.toMatchObject({
      status: 400,
      fieldErrors: { email: 'Invalid email format' },
    })
  })

  it('normalizes message errors and network failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({ message: 'Email already registered' }, 409),
      ),
    )

    await expect(apiRequest('/test')).rejects.toMatchObject({
      status: 409,
      message: 'Email already registered',
    })

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(apiRequest('/test')).rejects.toBeInstanceOf(ApiError)
  })

  it('clears rejected or expired sessions without clearing valid role denials', async () => {
    const validSession = createSession()
    authStorage.write(validSession)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, 403)))

    await expect(
      apiRequest('/admin', { token: validSession.token }),
    ).rejects.toMatchObject({ status: 403 })
    expect(authStorage.read()).toEqual(validSession)

    const expiredSession = createSession('USER', Date.now() - 1_000)
    authStorage.write(expiredSession)

    await expect(
      apiRequest('/rooms', { token: expiredSession.token }),
    ).rejects.toMatchObject({ status: 403 })
    expect(sessionStorage.length).toBe(0)
  })
})
