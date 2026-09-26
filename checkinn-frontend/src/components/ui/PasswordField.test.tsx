import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PasswordField } from './PasswordField'

describe('PasswordField', () => {
  it('shows and hides the password accessibly', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Password" name="password" />)

    const input = screen.getByLabelText('Password')
    const toggle = screen.getByRole('button', { name: /show password/i })

    expect(input).toHaveAttribute('type', 'password')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(input).toHaveAttribute('type', 'text')
    expect(
      screen.getByRole('button', { name: /hide password/i }),
    ).toHaveAttribute('aria-pressed', 'true')
  })
})
