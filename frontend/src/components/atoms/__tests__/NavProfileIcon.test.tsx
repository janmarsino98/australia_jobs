import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import NavProfileIcon from '../NavProfileIcon'

describe('NavProfileIcon', () => {
  const defaultProps = {
    profImg: 'https://example.com/profile.jpg',
    alt: 'User profile picture'
  }

  beforeEach(() => {
    // Mock console.error to avoid noise in tests when testing error scenarios
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders with user data', () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    const image = screen.getByAltText('User profile picture')
    const chevronIcon = button.querySelector('svg')
    
    expect(button).toBeInTheDocument()
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg')
    expect(chevronIcon).toBeInTheDocument()
  })

  test('renders default state without user', () => {
    render(<NavProfileIcon profImg="" alt="Default user" />)
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    const image = screen.getByAltText('Default user')
    
    expect(button).toBeInTheDocument()
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '')
  })

  test('handles click events', async () => {
    const mockOnClick = jest.fn()
    const user = userEvent.setup()
    
    render(<NavProfileIcon {...defaultProps} onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    await user.click(button)
    
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    expect(mockOnClick).toHaveBeenCalledWith(expect.any(Object))
  })

  test('accessibility attributes', () => {
    render(
      <NavProfileIcon 
        {...defaultProps} 
        aria-expanded={true}
        aria-haspopup={true}
      />
    )
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    
    expect(button).toHaveAttribute('aria-label', 'Open user menu')
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(button).toHaveAttribute('aria-haspopup', 'true')
  })

  test('handles image loading error with fallback', async () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const image = screen.getByAltText('User profile picture')
    
    // Simulate image load error
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(image).toHaveAttribute('src', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')
    })
  })

  test('handles image load success', async () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const image = screen.getByAltText('User profile picture')
    
    // Simulate successful image load
    fireEvent.load(image)
    
    // Image src should remain unchanged
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg')
  })

  test('updates image when profImg prop changes', () => {
    const { rerender } = render(<NavProfileIcon {...defaultProps} />)
    
    const image = screen.getByAltText('User profile picture')
    expect(image).toHaveAttribute('src', 'https://example.com/profile.jpg')
    
    rerender(<NavProfileIcon {...defaultProps} profImg="https://example.com/new-profile.jpg" />)
    
    expect(image).toHaveAttribute('src', 'https://example.com/new-profile.jpg')
  })

  test('has proper styling classes', () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    const image = screen.getByAltText('User profile picture')
    
    // Check button classes
    expect(button).toHaveClass('flex', 'items-center', 'space-x-2', 'rounded-full')
    expect(button).toHaveClass('transition-all', 'duration-200', 'hover:bg-pill-bg/50', 'p-1')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-pill-text', 'focus:ring-offset-2', 'group')
    
    // Check image classes
    expect(image).toHaveClass('w-full', 'h-full', 'object-cover', 'rounded-full')
    expect(image).toHaveClass('transition-transform', 'duration-200', 'group-hover:scale-105')
  })

  test('prevents multiple error fallbacks', async () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const image = screen.getByAltText('User profile picture')
    
    // First error should trigger fallback
    fireEvent.error(image)
    
    await waitFor(() => {
      expect(image).toHaveAttribute('src', 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')
    })
    
    // Second error should not change src again
    const fallbackSrc = image.getAttribute('src')
    fireEvent.error(image)
    
    expect(image).toHaveAttribute('src', fallbackSrc)
  })

  test('has proper image attributes', () => {
    render(<NavProfileIcon {...defaultProps} />)
    
    const image = screen.getByAltText('User profile picture')
    
    expect(image).toHaveAttribute('referrerPolicy', 'no-referrer')
    expect(image).toHaveAttribute('crossOrigin', 'anonymous')
  })

  test('handles keyboard interactions', async () => {
    const mockOnClick = jest.fn()
    const user = userEvent.setup()
    
    render(<NavProfileIcon {...defaultProps} onClick={mockOnClick} />)
    
    const button = screen.getByRole('button', { name: /open user menu/i })
    
    // Test Enter key
    button.focus()
    await user.keyboard('{Enter}')
    expect(mockOnClick).toHaveBeenCalledTimes(1)
    
    // Test Space key
    await user.keyboard(' ')
    expect(mockOnClick).toHaveBeenCalledTimes(2)
  })
})