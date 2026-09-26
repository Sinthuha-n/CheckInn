import { Eye, EyeOff } from 'lucide-react'
import { useState, type InputHTMLAttributes } from 'react'

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: string
  hint?: string
  label: string
}

export function PasswordField({
  disabled,
  error,
  hint,
  id,
  label,
  ...inputProps
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false)
  const inputId = id ?? inputProps.name
  const descriptionId = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <div className="password-field__control">
        <input
          aria-describedby={descriptionId}
          aria-invalid={error ? 'true' : undefined}
          disabled={disabled}
          id={inputId}
          type={isVisible ? 'text' : 'password'}
          {...inputProps}
        />
        <button
          aria-label={isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={isVisible}
          className="password-field__toggle"
          disabled={disabled}
          onClick={() => setIsVisible((visible) => !visible)}
          type="button"
        >
          {isVisible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
      {error ? (
        <p className="form-field__error" id={descriptionId} role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="form-field__hint" id={descriptionId}>
          {hint}
        </p>
      ) : null}
    </div>
  )
}
