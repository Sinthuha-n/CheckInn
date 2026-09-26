import { ArrowRight, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { PasswordField } from '../components/ui/PasswordField'
import { ApiError } from '../services/apiClient'
import {
  getSafeAuthDestination,
  type AuthRedirectState,
} from '../features/auth/authRedirect'
import {
  validateLogin,
  type AuthFieldErrors,
} from '../features/auth/authValidation'
import { useAuth } from '../features/auth/useAuth'

export function LoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()
  const state = (location.state as AuthRedirectState | null) ?? null
  const [email, setEmail] = useState(state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const destination = getSafeAuthDestination(state?.from)

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

    const validationErrors = validateLogin({ email, password })

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      await login({ email: email.trim(), password })
      navigate(destination, { replace: true })
    } catch (caughtError) {
      if (caughtError instanceof ApiError) {
        setError(caughtError.message)
        setFieldErrors(caughtError.fieldErrors ?? {})
      } else {
        setError('Something unexpected happened. Please try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="auth-page" aria-labelledby="login-title">
      <div className="auth-page__story" aria-hidden="true">
        <div className="auth-page__story-content">
          <KeyRound size={28} strokeWidth={1.5} />
          <p className="eyebrow">A considered return</p>
          <p className="auth-page__quote">
            Every remarkable stay deserves a thoughtful beginning.
          </p>
        </div>
      </div>

      <div className="auth-page__panel">
        <div className="auth-form-wrap">
          <p className="auth-form-wrap__step">Guest access · 01</p>
          <h1 id="login-title">Welcome back.</h1>
          <p className="auth-form-wrap__intro">
            Sign in to explore rooms and manage your stays.
          </p>

          {state?.registrationComplete ? (
            <p className="form-notice form-notice--success" role="status">
              Your account is ready. Sign in to continue.
            </p>
          ) : null}

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
              autoComplete="current-password"
              disabled={isSubmitting}
              error={fieldErrors.password}
              label="Password"
              name="password"
              onChange={(event) => {
                setPassword(event.target.value)
                clearFieldError('password')
              }}
              required
              value={password}
            />
            <Button disabled={isSubmitting} size="large" type="submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
            </Button>
          </form>

          <p className="auth-form-wrap__switch">
            New to CheckInn?{' '}
            <Link
              state={{ email: email.trim() || undefined, from: destination }}
              to="/register"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
