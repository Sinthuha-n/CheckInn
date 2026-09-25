import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { LoginRequest, LoginResponse } from '../../types/api'
import { authApi } from './authApi'
import { AuthContext } from './auth-context'
import {
  AUTH_SESSION_EXPIRED_EVENT,
  authStorage,
} from './authStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<LoginResponse | null>(() =>
    authStorage.read(),
  )

  useEffect(() => {
    const handleExpiredSession = () => setSession(null)
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleExpiredSession)

    return () =>
      window.removeEventListener(
        AUTH_SESSION_EXPIRED_EVENT,
        handleExpiredSession,
      )
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    const nextSession = await authApi.login(credentials)
    authStorage.write(nextSession)
    setSession(nextSession)
    return nextSession
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    setSession(null)
  }, [])

  const value = useMemo(
    () => ({
      session,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
