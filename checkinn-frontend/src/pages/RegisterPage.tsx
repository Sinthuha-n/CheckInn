import { ArrowRight, Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { FormField } from '../components/ui/FormField'
import { authApi } from '../features/auth/authApi'
import { ApiError } from '../services/apiClient'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Passwords must match' })
      return
    }

    if (password.length < 8) {
      setFieldErrors({ password: 'Password must contain at least 8 characters' })
      return
    }

    setIsSubmitting(true)

    try {
      await authApi.register({ name: name.trim(), email: email.trim(), password })
      navigate('/login', {
        replace: true,
        state: { email: email.trim(), registrationComplete: true },
      })
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

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <FormField
              autoComplete="name"
              error={fieldErrors.name}
              label="Full name"
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
            <FormField
              autoComplete="email"
              error={fieldErrors.email}
              label="Email address"
              name="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
              type="email"
              value={email}
            />
            <FormField
              autoComplete="new-password"
              error={fieldErrors.password}
              hint="Use at least 8 characters."
              label="Password"
              name="password"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
            <FormField
              autoComplete="new-password"
              error={fieldErrors.confirmPassword}
              label="Confirm password"
              name="confirmPassword"
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              type="password"
              value={confirmPassword}
            />
            <Button disabled={isSubmitting} size="large" type="submit">
              {isSubmitting ? 'Creating account…' : 'Create account'}
              {!isSubmitting ? <ArrowRight aria-hidden="true" size={18} /> : null}
            </Button>
          </form>

          <p className="auth-form-wrap__switch">
            Already a guest? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </section>
  )
}
