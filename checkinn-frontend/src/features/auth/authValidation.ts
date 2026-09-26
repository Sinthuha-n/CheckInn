export interface LoginFormValues {
  email: string
  password: string
}

export interface RegisterFormValues extends LoginFormValues {
  name: string
  confirmPassword: string
}

export type AuthFieldErrors = Partial<
  Record<keyof RegisterFormValues, string>
>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateLogin(values: LoginFormValues): AuthFieldErrors {
  const errors: AuthFieldErrors = {}
  const email = values.email.trim()

  if (!email) {
    errors.email = 'Email is required'
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address'
  }

  if (!values.password) {
    errors.password = 'Password is required'
  }

  return errors
}

export function validateRegistration(
  values: RegisterFormValues,
): AuthFieldErrors {
  const errors = validateLogin(values)

  if (!values.name.trim()) {
    errors.name = 'Name is required'
  }

  if (values.password && values.password.length < 8) {
    errors.password = 'Password must contain at least 8 characters'
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Confirm your password'
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords must match'
  }

  return errors
}
