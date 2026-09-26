import type { InputHTMLAttributes } from 'react'

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string
  hint?: string
  label: string
}

export function FormField({
  error,
  hint,
  id,
  label,
  ...inputProps
}: FormFieldProps) {
  const inputId = id ?? inputProps.name
  const descriptionId = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className="form-field">
      <label htmlFor={inputId}>{label}</label>
      <input
        aria-describedby={descriptionId}
        aria-invalid={error ? 'true' : undefined}
        id={inputId}
        {...inputProps}
      />
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
