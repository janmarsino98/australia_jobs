import { render, screen } from '@testing-library/react'
import LocationIcon from '../LocationIcon'

// Mock react-icons
jest.mock('react-icons/io5', () => ({
  IoLocationOutline: () => <svg data-testid="location-icon" />
}))

describe('LocationIcon', () => {
  test('renders icon correctly', () => {
    render(<LocationIcon />)
    
    const icon = screen.getByTestId('location-icon')
    
    expect(icon).toBeInTheDocument()
  })

  test('renders container with correct styling', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass(
      'bg-dark-white',
      'text-main-text',
      'h-full',
      'w-full',
      'flex',
      'items-center',
      'justify-center',
      'text-[20px]',
      'rounded-lg'
    )
  })

  test('has proper layout classes', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('flex', 'items-center', 'justify-center')
  })

  test('has correct background and text colors', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('bg-dark-white', 'text-main-text')
  })

  test('has proper sizing classes', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('h-full', 'w-full')
  })

  test('has custom text size', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('text-[20px]')
  })

  test('has rounded corners', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('rounded-lg')
  })

  test('renders as div element', () => {
    const { container } = render(<LocationIcon />)
    
    expect(container.firstChild?.nodeName).toBe('DIV')
  })

  test('icon is centered within container', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    const icon = screen.getByTestId('location-icon')
    
    expect(containerDiv).toContainElement(icon)
    expect(containerDiv).toHaveClass('flex', 'items-center', 'justify-center')
  })

  test('component structure is correct', () => {
    render(<LocationIcon />)
    
    const icon = screen.getByTestId('location-icon')
    const container = icon.parentElement
    
    expect(container).toBeInTheDocument()
    expect(container?.tagName).toBe('DIV')
  })

  test('maintains consistent styling', () => {
    const { rerender } = render(<LocationIcon />)
    const { container: container1 } = render(<LocationIcon />)
    
    rerender(<LocationIcon />)
    
    const containerDiv1 = container1.firstChild as HTMLElement
    const { container: container2 } = render(<LocationIcon />)
    const containerDiv2 = container2.firstChild as HTMLElement
    
    expect(containerDiv1.className).toBe(containerDiv2.className)
  })

  test('icon displays correctly', () => {
    render(<LocationIcon />)
    
    const icon = screen.getByTestId('location-icon')
    
    expect(icon).toBeInTheDocument()
    expect(icon.tagName).toBe('svg')
  })

  test('no props required', () => {
    // Should render without any props
    expect(() => render(<LocationIcon />)).not.toThrow()
  })

  test('container has full dimensions', () => {
    const { container } = render(<LocationIcon />)
    
    const containerDiv = container.firstChild as HTMLElement
    
    expect(containerDiv).toHaveClass('h-full', 'w-full')
  })
})