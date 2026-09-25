export interface AuthRedirectState {
  from?: string
  email?: string
  registrationComplete?: boolean
}

export const getSafeAuthDestination = (value: string | undefined) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : '/rooms'
