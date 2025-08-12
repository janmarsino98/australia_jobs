import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Category_Pill from '../Category_Pill'

describe('Category_Pill', () => {
  const defaultProps = {
    name: 'Technology',
    handleClick: jest.fn(),
    value: 'tech'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders category display', () => {
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    const categoryName = screen.getByText('Technology')
    
    expect(button).toBeInTheDocument()
    expect(categoryName).toBeInTheDocument()
  })

  test('handles click interactions', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(defaultProps.handleClick).toHaveBeenCalledWith('tech')
    expect(defaultProps.handleClick).toHaveBeenCalledTimes(1)
  })

  test('handles keyboard interactions - Enter key', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Enter}')
    
    expect(defaultProps.handleClick).toHaveBeenCalledWith('tech')
  })

  test('handles keyboard interactions - Space key', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard(' ')
    
    expect(defaultProps.handleClick).toHaveBeenCalledWith('tech')
  })

  test('does not trigger on other keys', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    button.focus()
    await user.keyboard('{Escape}')
    await user.keyboard('{Tab}')
    await user.keyboard('a')
    
    expect(defaultProps.handleClick).not.toHaveBeenCalled()
  })

  test('displays remove indicator on hover', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Initially, X indicator should not be visible
    expect(screen.queryByText('X')).not.toBeInTheDocument()
    
    // Hover over button
    await user.hover(button)
    
    // X indicator should now be visible
    const xIndicator = screen.getByText('X')
    expect(xIndicator).toBeInTheDocument()
    expect(xIndicator).toHaveAttribute('aria-hidden', 'true')
  })

  test('hides remove indicator on mouse leave', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Hover to show X
    await user.hover(button)
    expect(screen.getByText('X')).toBeInTheDocument()
    
    // Unhover to hide X
    await user.unhover(button)
    expect(screen.queryByText('X')).not.toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    expect(button).toHaveAttribute('aria-label', 'Remove Technology category')
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  test('has correct styling classes', () => {
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    expect(button).toHaveClass(
      'w-max',
      'h-max',
      'bg-pill-bg',
      'text-pill-text',
      'px-[20px]',
      'py-[10px]',
      'rounded-full',
      'hover:border-red-500',
      'hover:border',
      'relative'
    )
  })

  test('X indicator has correct styling', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    await user.hover(button)
    
    const xIndicator = screen.getByText('X')
    expect(xIndicator).toHaveClass(
      'absolute',
      'right-0',
      'top-0',
      'font-bold',
      'text-[10px]',
      'flex',
      'border',
      'border-red-700',
      'text-red-500',
      'bg-red-300',
      'rounded-full',
      'w-4',
      'h-4',
      'p-1',
      'items-center',
      'justify-center'
    )
  })

  test('renders different category names', () => {
    render(<Category_Pill {...defaultProps} name="Finance" />)
    
    expect(screen.getByText('Finance')).toBeInTheDocument()
  })

  test('passes different values to click handler', async () => {
    const user = userEvent.setup()
    render(<Category_Pill {...defaultProps} value="finance" />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(defaultProps.handleClick).toHaveBeenCalledWith('finance')
  })

  test('aria-label updates with different names', () => {
    render(<Category_Pill {...defaultProps} name="Healthcare" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Remove Healthcare category')
  })

  test('handles empty category name', () => {
    render(<Category_Pill {...defaultProps} name="" />)
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Remove  category')
  })

  test('handles special characters in name', () => {
    render(<Category_Pill {...defaultProps} name="R&D/Research" />)
    
    expect(screen.getByText('R&D/Research')).toBeInTheDocument()
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label', 'Remove R&D/Research category')
  })

  test('maintains button focus styles', () => {
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    button.focus()
    
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500')
  })

  test('hover state changes are immediate', () => {
    render(<Category_Pill {...defaultProps} />)
    
    const button = screen.getByRole('button')
    
    // Simulate mouse enter
    fireEvent.mouseEnter(button)
    expect(screen.getByText('X')).toBeInTheDocument()
    
    // Simulate mouse leave
    fireEvent.mouseLeave(button)
    expect(screen.queryByText('X')).not.toBeInTheDocument()
  })

  test('keyboard events trigger the handler correctly', () => {
    const mockHandler = jest.fn()
    render(<Category_Pill {...defaultProps} handleClick={mockHandler} />)
    
    const button = screen.getByRole('button')
    
    // Test Enter key triggers click handler
    fireEvent.keyDown(button, { key: 'Enter' })
    expect(mockHandler).toHaveBeenCalledWith('tech')
    
    mockHandler.mockClear()
    
    // Test Space key triggers click handler  
    fireEvent.keyDown(button, { key: ' ' })
    expect(mockHandler).toHaveBeenCalledWith('tech')
  })

  test('handles long category names', () => {
    const longName = "Very Long Category Name That Should Still Work Properly"
    render(<Category_Pill {...defaultProps} name={longName} />)
    
    expect(screen.getByText(longName)).toBeInTheDocument()
  })
})