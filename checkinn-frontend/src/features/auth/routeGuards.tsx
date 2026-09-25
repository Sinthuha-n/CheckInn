import { Navigate, Outlet, useLocation } from 'react-router-dom'
import type { Role } from '../../types/api'
import { AccessDeniedPage } from '../../pages/AccessDeniedPage'
import {
  getSafeAuthDestination,
  type AuthRedirectState,
} from './authRedirect'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      />
    )
  }

  return <Outlet />
}

export function GuestOnlyRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const state = (location.state as AuthRedirectState | null) ?? null

  return isAuthenticated ? (
    <Navigate to={getSafeAuthDestination(state?.from)} replace />
  ) : (
    <Outlet />
  )
}

export function RoleRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { session } = useAuth()

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return allowedRoles.includes(session.role) ? <Outlet /> : <AccessDeniedPage />
}
