import { ArrowRight, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { PasswordField } from '../components/ui/PasswordField'
import { authApi } from '../features/auth/authApi'
import {
  getSafeAuthDestination,
  type AuthRedirectState,
} from '../features/auth/authRedirect'
import {
  validateRegistration,
  type AuthFieldErrors,
} from '../features/auth/authValidation'
import { useAuth } from '../features/auth/useAuth'
import { ApiError } from '../services/apiClient'

export function RegisterPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const redirectState = (location.state as AuthRedirectState | null) ?? null
  const destination = getSafeAuthDestination(redirectState?.from)
  const [name, setName] = useState('')
  const [email, setEmail] = useState(redirectState?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [submissionStage, setSubmissionStage] = useState<
    'idle' | 'registering' | 'signing-in'
  >('idle')
  const isSubmitting = submissionStage !== 'idle'

  const clearFieldError = (field: keyof AuthFieldErrors) => {
    setError('')
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    const validationErrors = validateRegistration({
      name,
      email,
      password,
      confirmPassword,
    })

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    const credentials = { email: email.trim(), password }
    setSubmissionStage('registering')

    try {
      await authApi.register({ name: name.trim(), ...credentials })

      try {
        setSubmissionStage('signing-in')
        await login(credentials)
        navigate(destination, { replace: true })
      } catch {
        navigate('/login', {
          replace: true,
          state: {
            email: credentials.email,
            from: destination,
            registrationComplete: true,
          } satisfies AuthRedirectState,
        })
      }
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message)
        setFieldErrors(caughtError.fieldErrors ?? {})
      } else {
        setError('Something unexpected happened. Please try again.')
      }
    } finally {
      setSubmissionStage('idle')
    }
  }

  return (
    <section className="auth-page auth-page--register" aria-labelledby="register-title">
      <div className="auth-page__story" aria-hidden="true">
        <div className="auth-page__story-content">
          <Sparkles size={28} strokeWidth={1.5} />
          <p className="eyebrow">Your next chapter</p>
          <p className="auth-page__quote">
            A private key to beautifully considered stays.
          </p>
        </div>
      </div>

      <div className="auth-page__panel">
        <div className="auth-form-wrap">
          <p className="auth-form-wrap__step">Guest access · 02</p>
          <h1 id="register-title">Join CheckInn.</h1>
          <p className="auth-form-wrap__intro">
            Create your account to discover and reserve rooms.
          </p>

          {error ? (
            <p className="form-notice form-notice--error" role="alert">
              {error}
            </p>
          ) : null}

          <form
            aria-busy={isSubmitting}
            className="auth-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <FormField
              autoComplete="name"
              disabled={isSubmitting}
              error={fieldErrors.name}
              label="Full name"
              name="name"
              onChange={(event) => {
                setName(event.target.value)
                clearFieldError('name')
              }}
              required
              value={name}
            />
            <FormField
              autoComplete="email"
              disabled={isSubmitting}
              error={fieldErrors.email}
              label="Email address"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value)
                clearFieldError('email')
              }}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            <PasswordField
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldErrors.password}
              hint="Use at least 8 characters."
              label="Password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value)
                clearFieldError('password')
              }}
              required
              value={password}
            />
            <PasswordField
              autoComplete="new-password"
              disabled={isSubmitting}
              error={fieldErrors.confirmPassword}
              label="Confirm password"
              name="confirmPassword"
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                clearFieldError('confirmPassword')
              }}
              required
              value={confirmPassword}
            />
            <Button disabled={isSubmitting} size="large" type="submit">
              {submissionStage === 'registering'
                ? 'Creating account…'
                : submissionStage === 'signing-in'
                  ? 'Signing you in…'
                  : 'Create account'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
            </Button>
          </form>

          <p className="auth-form-wrap__switch">
            Already a guest?{' '}
            <Link
              state={{ email: email.trim() || undefined, from: destination }}
              to="/login"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
