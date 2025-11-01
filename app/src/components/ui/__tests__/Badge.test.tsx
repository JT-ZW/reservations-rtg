import { render, screen } from '@testing-library/react'
import { Badge } from '../Badge'

describe('Badge Component', () => {
  it('renders with children text', () => {
    render(<Badge>Active</Badge>)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('applies success variant styles', () => {
    render(<Badge variant="success">Success</Badge>)
    const badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('applies warning variant styles', () => {
    render(<Badge variant="warning">Warning</Badge>)
    const badge = screen.getByText('Warning')
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('applies danger variant styles', () => {
    render(<Badge variant="danger">Danger</Badge>)
    const badge = screen.getByText('Danger')
    expect(badge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('applies info variant styles', () => {
    render(<Badge variant="info">Info</Badge>)
    const badge = screen.getByText('Info')
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('applies default variant styles', () => {
    render(<Badge variant="default">Default</Badge>)
    const badge = screen.getByText('Default')
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('applies custom className', () => {
    render(<Badge className="custom-badge">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-badge')
  })
})
