import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Progress } from '../progress'

describe('Progress Component', () => {
  test('renders with default styling', () => {
    render(<Progress data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    expect(progress).toBeInTheDocument()
    expect(progress).toHaveClass(
      'relative', 'h-4', 'w-full', 'overflow-hidden', 'rounded-full', 'bg-secondary'
    )
  })

  test('displays progress value correctly', () => {
    render(<Progress value={50} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('[style*="transform"]')
    
    expect(indicator).toHaveStyle('transform: translateX(-50%)')
  })

  test('handles 0% progress', () => {
    render(<Progress value={0} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('[style*="transform"]')
    
    expect(indicator).toHaveStyle('transform: translateX(-100%)')
  })

  test('handles 100% progress', () => {
    render(<Progress value={100} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('[style*="transform"]')
    
    expect(indicator).toHaveStyle('transform: translateX(-0%)')
  })

  test('handles undefined value (defaults to 0)', () => {
    render(<Progress data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('[style*="transform"]')
    
    expect(indicator).toHaveStyle('transform: translateX(-100%)')
  })

  test('applies custom className', () => {
    render(<Progress className="custom-progress" data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    expect(progress).toHaveClass('custom-progress')
    expect(progress).toHaveClass('relative', 'h-4', 'w-full') // Still has default classes
  })

  test('forwards ref correctly', () => {
    const ref = jest.fn()
    render(<Progress ref={ref} />)
    expect(ref).toHaveBeenCalled()
  })

  test('renders progress indicator with proper styling', () => {
    render(<Progress value={75} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('div')
    
    expect(indicator).toHaveClass(
      'h-full', 'w-full', 'flex-1', 'bg-primary', 'transition-all'
    )
  })

  test('has proper accessibility attributes', () => {
    render(<Progress value={60} aria-label="Loading progress" data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    
    expect(progress).toHaveAttribute('role', 'progressbar')
    expect(progress).toHaveAttribute('aria-label', 'Loading progress')
    expect(progress).toHaveAttribute('aria-valuenow', '60')
  })

  test('supports min and max attributes', () => {
    render(<Progress value={30} min={0} max={100} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    
    expect(progress).toHaveAttribute('aria-valuemin', '0')
    expect(progress).toHaveAttribute('aria-valuemax', '100')
    expect(progress).toHaveAttribute('aria-valuenow', '30')
  })

  test('handles edge case values', () => {
    const { rerender } = render(<Progress value={-10} data-testid="progress" />)
    let progress = screen.getByTestId('progress')
    let indicator = progress.querySelector('[style*="transform"]')
    expect(indicator).toHaveStyle('transform: translateX(-110%)')

    rerender(<Progress value={150} data-testid="progress" />)
    progress = screen.getByTestId('progress')
    indicator = progress.querySelector('[style*="transform"]')
    expect(indicator).toHaveStyle('transform: translateX(50%)')
  })

  test('supports additional HTML attributes', () => {
    render(
      <Progress 
        value={40}
        id="test-progress"
        title="Progress indicator"
        data-testid="progress"
      />
    )
    const progress = screen.getByTestId('progress')
    
    expect(progress).toHaveAttribute('id', 'test-progress')
    expect(progress).toHaveAttribute('title', 'Progress indicator')
  })

  test('progress indicator responds to value changes', () => {
    const { rerender } = render(<Progress value={25} data-testid="progress" />)
    let progress = screen.getByTestId('progress')
    let indicator = progress.querySelector('[style*="transform"]')
    expect(indicator).toHaveStyle('transform: translateX(-75%)')

    rerender(<Progress value={80} data-testid="progress" />)
    progress = screen.getByTestId('progress')
    indicator = progress.querySelector('[style*="transform"]')
    expect(indicator).toHaveStyle('transform: translateX(-20%)')
  })

  test('maintains correct aspect ratio and sizing', () => {
    render(<Progress value={50} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    
    expect(progress).toHaveClass('h-4', 'w-full')
    expect(progress).toHaveClass('rounded-full')
    expect(progress).toHaveClass('overflow-hidden')
  })

  test('progress bar has transition animations', () => {
    render(<Progress value={70} data-testid="progress" />)
    const progress = screen.getByTestId('progress')
    const indicator = progress.querySelector('div')
    
    expect(indicator).toHaveClass('transition-all')
  })
})