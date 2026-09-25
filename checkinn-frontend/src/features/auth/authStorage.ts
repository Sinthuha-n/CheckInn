import type { LoginResponse } from '../../types/api'

const SESSION_KEY = 'checkinn.session'
export const AUTH_SESSION_EXPIRED_EVENT = 'checkinn:session-expired'

interface JwtPayload {
  exp?: number
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  const payload = token.split('.')[1]

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )

    return JSON.parse(atob(padded)) as JwtPayload
  } catch {
    return null
  }
}

export const isTokenExpired = (token: string, now = Date.now()) => {
  const payload = decodeJwtPayload(token)

  return !payload?.exp || payload.exp * 1000 <= now
}

const isLoginResponse = (value: unknown): value is LoginResponse => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const session = value as Partial<LoginResponse>

  return (
    typeof session.id === 'number' &&
    typeof session.name === 'string' &&
    typeof session.email === 'string' &&
    (session.role === 'USER' || session.role === 'ADMIN') &&
    typeof session.token === 'string'
  )
}

export const authStorage = {
  read(): LoginResponse | null {
    const stored = sessionStorage.getItem(SESSION_KEY)

    if (!stored) {
      return null
    }

    try {
      const session: unknown = JSON.parse(stored)

      if (!isLoginResponse(session) || isTokenExpired(session.token)) {
        sessionStorage.removeItem(SESSION_KEY)
        return null
      }

      return session
    } catch {
      sessionStorage.removeItem(SESSION_KEY)
      return null
    }
  },

  write(session: LoginResponse) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  },

  clear() {
    sessionStorage.removeItem(SESSION_KEY)
  },

  expire() {
    sessionStorage.removeItem(SESSION_KEY)
    window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT))
  },
}
