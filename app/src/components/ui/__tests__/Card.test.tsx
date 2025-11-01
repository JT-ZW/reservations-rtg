import { render, screen } from '@testing-library/react'
import { Card } from '../Card'

describe('Card Component', () => {
  it('renders children content', () => {
    render(
      <Card>
        <p>Card content</p>
      </Card>
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies default styles', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border', 'p-6')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-card">Content</Card>)
    const card = container.firstChild as HTMLElement
    expect(card).toHaveClass('custom-card')
  })

  it('renders with complex nested content', () => {
    render(
      <Card>
        <h2>Title</h2>
        <p>Description</p>
        <button>Action</button>
      </Card>
    )
    
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })
})
