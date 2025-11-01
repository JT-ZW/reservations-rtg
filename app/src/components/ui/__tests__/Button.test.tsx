import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from '../Button'

describe('Button Component', () => {
  it('renders with children text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = jest.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>)
    const button = screen.getByText('Primary')
    expect(button).toHaveClass('from-amber-500')
    expect(button).toHaveClass('to-yellow-600')
  })

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const button = screen.getByText('Secondary')
    expect(button).toHaveClass('bg-gray-200')
  })

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Delete</Button>)
    const button = screen.getByText('Delete')
    expect(button).toHaveClass('bg-red-600')
  })

  it('can be disabled', () => {
    render(<Button disabled>Disabled</Button>)
    const button = screen.getByText('Disabled')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50')
  })

  it('applies small size styles', () => {
    render(<Button size="sm">Small</Button>)
    const button = screen.getByText('Small')
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm')
  })

  it('applies large size styles', () => {
    render(<Button size="lg">Large</Button>)
    const button = screen.getByText('Large')
    expect(button).toHaveClass('px-6', 'py-3', 'text-lg')
  })

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom</Button>)
    const button = screen.getByText('Custom')
    expect(button).toHaveClass('custom-class')
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    const button = screen.getByText('Loading')
    expect(button).toBeDisabled()
    expect(button.querySelector('svg')).toBeInTheDocument()
  })
})
