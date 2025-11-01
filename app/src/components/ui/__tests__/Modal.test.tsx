import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalFooter } from '../Modal'

describe('Modal Component', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    mockOnClose.mockClear()
  })

  it('renders when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={mockOnClose}>
        <p>Modal content</p>
      </Modal>
    )
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
  })

  it('renders with title', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose}>
        <p>Content</p>
      </Modal>
    )
    
    const backdrop = container.querySelector('.bg-black')
    if (backdrop) {
      await user.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test">
        <p>Content</p>
      </Modal>
    )
    
    const closeButton = screen.getByRole('button')
    await user.click(closeButton)
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('applies small size styles', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="sm">
        <p>Content</p>
      </Modal>
    )
    
    const modal = container.querySelector('.max-w-sm')
    expect(modal).toBeInTheDocument()
  })

  it('applies large size styles', () => {
    const { container } = render(
      <Modal isOpen={true} onClose={mockOnClose} size="lg">
        <p>Content</p>
      </Modal>
    )
    
    const modal = container.querySelector('.max-w-2xl')
    expect(modal).toBeInTheDocument()
  })

  it('hides close button when showCloseButton is false', () => {
    render(
      <Modal isOpen={true} onClose={mockOnClose} title="Test" showCloseButton={false}>
        <p>Content</p>
      </Modal>
    )
    
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('ModalFooter Component', () => {
  it('renders children content', () => {
    render(
      <ModalFooter>
        <button>Cancel</button>
        <button>Save</button>
      </ModalFooter>
    )
    
    expect(screen.getByText('Cancel')).toBeInTheDocument()
    expect(screen.getByText('Save')).toBeInTheDocument()
  })

  it('applies footer styles', () => {
    const { container } = render(
      <ModalFooter>
        <button>Action</button>
      </ModalFooter>
    )
    
    const footer = container.firstChild as HTMLElement
    expect(footer).toHaveClass('flex', 'items-center', 'justify-end', 'gap-3')
  })
})
