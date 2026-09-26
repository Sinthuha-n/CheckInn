import { validateLogin, validateRegistration } from './authValidation'

describe('authentication form validation', () => {
  it('validates required login fields and email format', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    })
    expect(validateLogin({ email: 'guest', password: 'secret' })).toEqual({
      email: 'Enter a valid email address',
    })
  })

  it('validates registration identity and password rules', () => {
    expect(
      validateRegistration({
        name: ' ',
        email: 'guest@example.com',
        password: 'short',
        confirmPassword: 'different',
      }),
    ).toEqual({
      name: 'Name is required',
      password: 'Password must contain at least 8 characters',
      confirmPassword: 'Passwords must match',
    })
  })
})
