export interface AuthRedirectState {
  from?: string
  email?: string
  registrationComplete?: boolean
}

const APP_ORIGIN = 'https://checkinn.local'
const AUTH_PATHS = new Set(['/login', '/register'])

export function getSafeAuthDestination(value: string | undefined) {
  if (!value?.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/find-your-stay'
  }

  try {
    const destination = new URL(value, APP_ORIGIN)
    const normalizedPath = destination.pathname.replace(/\/$/, '') || '/'

    if (destination.origin !== APP_ORIGIN || AUTH_PATHS.has(normalizedPath)) {
      return '/find-your-stay'
    }

    return `${destination.pathname}${destination.search}${destination.hash}`
  } catch {
    return '/find-your-stay'
  }
}
