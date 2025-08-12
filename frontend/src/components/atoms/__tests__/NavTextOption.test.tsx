import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import NavTextOption from '../NavTextOption'

// Helper to render with router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>)
}

describe('NavTextOption', () => {
  const defaultProps = {
    text: 'Test Option'
  }

  test('renders text rendering without path', () => {
    render(<NavTextOption {...defaultProps} />)
    
    const span = screen.getByText('Test Option')
    
    expect(span).toBeInTheDocument()
    expect(span.tagName).toBe('SPAN')
    expect(span).toHaveClass('text-sm', 'font-medium', 'text-main-text', 'px-4', 'py-2')
  })

  test('renders link functionality with path', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/test-path')
    expect(link).toHaveTextContent('Test Option')
  })

  test('handles active state styling', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" isActive={true} />)
    
    const link = screen.getByRole('menuitem')
    const activeIndicator = link.querySelector('div[aria-hidden="true"]')
    
    expect(link).toHaveAttribute('aria-current', 'page')
    expect(link).toHaveClass('text-pill-text')
    expect(activeIndicator).toBeInTheDocument()
    expect(activeIndicator).toHaveClass('absolute', 'bottom-0', 'left-1/2', 'transform', '-translate-x-1/2', 'w-6', 'h-0.5', 'bg-pill-text', 'rounded-full')
  })

  test('handles inactive state', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" isActive={false} />)
    
    const link = screen.getByRole('menuitem')
    const activeIndicator = link.querySelector('div[aria-hidden="true"]')
    
    expect(link).not.toHaveAttribute('aria-current')
    expect(link).toHaveClass('text-main-text')
    expect(activeIndicator).not.toBeInTheDocument()
  })

  test('handles primary styling', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" isPrimary={true} />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveClass('bg-primary', 'text-primary-foreground', 'hover:bg-primary/90', 'rounded-md')
    expect(link).not.toHaveClass('text-main-text')
  })

  test('primary button does not show active indicator', () => {
    renderWithRouter(
      <NavTextOption 
        {...defaultProps} 
        path="/test-path" 
        isPrimary={true} 
        isActive={true} 
      />
    )
    
    const link = screen.getByRole('menuitem')
    const activeIndicator = link.querySelector('div[aria-hidden="true"]')
    
    expect(activeIndicator).not.toBeInTheDocument()
  })

  test('has proper accessibility attributes', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveAttribute('role', 'menuitem')
    expect(link).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2', 'focus-visible:ring-ring', 'focus-visible:ring-offset-2')
  })

  test('applies base classes consistently', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveClass(
      'relative',
      'text-sm',
      'font-medium', 
      'transition-colors',
      'duration-200',
      'px-4',
      'py-2'
    )
  })

  test('hover classes are applied correctly for non-primary', () => {
    renderWithRouter(<NavTextOption {...defaultProps} path="/test-path" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveClass('hover:text-pill-text')
  })

  test('renders different text values', () => {
    renderWithRouter(<NavTextOption text="Different Text" path="/test" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveTextContent('Different Text')
  })

  test('handles empty text gracefully', () => {
    renderWithRouter(<NavTextOption text="" path="/test" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveTextContent('')
  })

  test('renders correctly without optional props', () => {
    renderWithRouter(<NavTextOption text="Basic Text" path="/basic" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toBeInTheDocument()
    expect(link).toHaveClass('text-main-text')
    expect(link).not.toHaveAttribute('aria-current')
  })

  test('handles special characters in text', () => {
    renderWithRouter(<NavTextOption text="Special & Characters <>" path="/special" />)
    
    const link = screen.getByRole('menuitem')
    
    expect(link).toHaveTextContent('Special & Characters <>')
  })
})