import { createContext } from 'react'
import type { LoginRequest, LoginResponse } from '../../types/api'

export interface AuthContextValue {
  session: LoginResponse | null
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<LoginResponse>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
