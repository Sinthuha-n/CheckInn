import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('uses native button behavior and applies its visual options', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button size="large" variant="secondary" onClick={handleClick}>
        Continue
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Continue' })
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveClass('button--large', 'button--secondary')

    await user.click(button)
    expect(handleClick).toHaveBeenCalledOnce()
  })

  it('does not fire when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()

    render(
      <Button disabled onClick={handleClick}>
        Unavailable
      </Button>,
    )

    await user.click(screen.getByRole('button', { name: 'Unavailable' }))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
