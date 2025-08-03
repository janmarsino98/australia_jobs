import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Badge } from '../badge'

describe('Badge Component', () => {
  test('renders with default variant', () => {
    render(<Badge data-testid="badge">Default Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Default Badge')
    expect(badge).toHaveClass(
      'inline-flex', 'items-center', 'rounded-full', 'border', 'px-2.5', 'py-0.5',
      'text-xs', 'font-semibold', 'transition-colors',
      'border-transparent', 'bg-primary', 'text-primary-foreground', 'hover:bg-primary/80'
    )
  })

  test('renders different variants', () => {
    const { rerender } = render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass(
      'border-transparent', 'bg-secondary', 'text-secondary-foreground', 'hover:bg-secondary/80'
    )

    rerender(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass(
      'border-transparent', 'bg-destructive', 'text-destructive-foreground', 'hover:bg-destructive/80'
    )

    rerender(<Badge variant="outline" data-testid="badge">Outline</Badge>)
    expect(screen.getByTestId('badge')).toHaveClass('text-foreground')
    expect(screen.getByTestId('badge')).not.toHaveClass('border-transparent')
  })

  test('applies custom className', () => {
    render(<Badge className="custom-badge" data-testid="badge">Custom Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('custom-badge')
    expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-full') // Still has default classes
  })

  test('supports HTML div attributes', () => {
    render(
      <Badge 
        id="test-badge"
        data-custom="test"
        title="Badge tooltip"
        data-testid="badge"
      >
        Attributed Badge
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('id', 'test-badge')
    expect(badge).toHaveAttribute('data-custom', 'test')
    expect(badge).toHaveAttribute('title', 'Badge tooltip')
  })

  test('renders with different content types', () => {
    const { rerender } = render(<Badge data-testid="badge">Text Only</Badge>)
    expect(screen.getByTestId('badge')).toHaveTextContent('Text Only')

    rerender(
      <Badge data-testid="badge">
        <span>With Span</span>
      </Badge>
    )
    expect(screen.getByTestId('badge')).toHaveTextContent('With Span')

    rerender(<Badge data-testid="badge">123</Badge>)
    expect(screen.getByTestId('badge')).toHaveTextContent('123')
  })

  test('handles empty content', () => {
    render(<Badge data-testid="badge" />)
    const badge = screen.getByTestId('badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('')
  })

  test('has proper focus styling', () => {
    render(<Badge data-testid="badge">Focusable Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass(
      'focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2'
    )
  })

  test('maintains consistent sizing', () => {
    render(<Badge data-testid="badge">Size Test</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs')
  })

  test('is properly shaped', () => {
    render(<Badge data-testid="badge">Shape Test</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('rounded-full', 'border')
  })

  test('has transition animations', () => {
    render(<Badge data-testid="badge">Animated Badge</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveClass('transition-colors')
  })

  test('renders as a div element', () => {
    render(<Badge data-testid="badge">Element Test</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge.tagName).toBe('DIV')
  })

  test('supports event handlers', () => {
    const handleClick = jest.fn()
    const handleMouseOver = jest.fn()
    
    render(
      <Badge 
        onClick={handleClick}
        onMouseOver={handleMouseOver}
        data-testid="badge"
      >
        Interactive Badge
      </Badge>
    )
    
    const badge = screen.getByTestId('badge')
    
    badge.click()
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Trigger mouseover event
    const mouseOverEvent = new MouseEvent('mouseover', { bubbles: true })
    badge.dispatchEvent(mouseOverEvent)
    expect(handleMouseOver).toHaveBeenCalledTimes(1)
  })

  test('works with complex content', () => {
    render(
      <Badge variant="secondary" data-testid="badge">
        <span>🎉</span>
        <span>Success</span>
        <span>42</span>
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveTextContent('🎉Success42')
    expect(badge).toHaveClass('bg-secondary', 'text-secondary-foreground')
  })

  test('maintains accessibility when used as interactive element', () => {
    render(
      <Badge 
        role="button"
        tabIndex={0}
        aria-label="Close notification"
        data-testid="badge"
      >
        ×
      </Badge>
    )
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveAttribute('role', 'button')
    expect(badge).toHaveAttribute('tabindex', '0')
    expect(badge).toHaveAttribute('aria-label', 'Close notification')
  })

  test('supports all variant types', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const
    
    variants.forEach((variant, index) => {
      const { unmount } = render(<Badge variant={variant} data-testid={`badge-${variant}`}>{variant}</Badge>)
      const badge = screen.getByTestId(`badge-${variant}`)
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveTextContent(variant)
      unmount()
    })
  })

  test('handles long text content gracefully', () => {
    const longText = 'This is a very long badge text that might need to be handled gracefully'
    render(<Badge data-testid="badge">{longText}</Badge>)
    const badge = screen.getByTestId('badge')
    expect(badge).toHaveTextContent(longText)
    expect(badge).toHaveClass('text-xs') // Should still maintain small text size
  })

  test('can be used in combination with other elements', () => {
    render(
      <div>
        <span>Status: </span>
        <Badge variant="destructive" data-testid="status-badge">Error</Badge>
        <span> - Please check your input</span>
      </div>
    )
    const badge = screen.getByTestId('status-badge')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Error')
    expect(badge).toHaveClass('bg-destructive')
  })
})