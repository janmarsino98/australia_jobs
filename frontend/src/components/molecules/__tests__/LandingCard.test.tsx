import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import LandingCard from '../LandingCard'

// Mock icon component
const MockIcon = ({ className }: { className?: string }) => (
  <div data-testid="mock-icon" className={className}>
    Icon
  </div>
)

const renderComponent = (props = {}) => {
  const defaultProps = {
    title: 'Find Your Perfect Job',
    text: 'Discover thousands of job opportunities from top companies across Australia.',
  }
  
  return render(
    <BrowserRouter>
      <LandingCard {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('LandingCard', () => {
  test('renders card content correctly', () => {
    renderComponent()
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Find Your Perfect Job')
    expect(screen.getByText('Discover thousands of job opportunities from top companies across Australia.')).toBeInTheDocument()
  })

  test('applies correct card styling', () => {
    renderComponent()
    
    const card = screen.getByRole('heading', { level: 2 }).closest('div')
    expect(card).toHaveClass(
      'p-6',
      'bg-white',
      'rounded-lg',
      'shadow-md',
      'hover:shadow-lg',
      'transition-shadow'
    )
  })

  test('title has correct styling', () => {
    renderComponent()
    
    const title = screen.getByRole('heading', { level: 2 })
    expect(title).toHaveClass(
      'text-xl',
      'font-semibold',
      'mb-2',
      'text-gray-800',
      'flex',
      'flex-row',
      'items-center'
    )
  })

  test('text has correct styling', () => {
    renderComponent()
    
    const text = screen.getByText('Discover thousands of job opportunities from top companies across Australia.')
    expect(text).toHaveClass('text-gray-600')
    expect(text.tagName.toLowerCase()).toBe('p')
  })

  test('renders without link when href not provided', () => {
    renderComponent()
    
    expect(screen.queryByText('Learn more →')).not.toBeInTheDocument()
  })

  test('renders with link when href is provided', () => {
    renderComponent({ href: '/jobs' })
    
    const link = screen.getByRole('link', { name: 'Learn more →' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/jobs')
  })

  test('link has correct styling', () => {
    renderComponent({ href: '/about' })
    
    const link = screen.getByRole('link', { name: 'Learn more →' })
    expect(link).toHaveClass(
      'mt-4',
      'inline-block',
      'text-blue-500',
      'hover:underline'
    )
  })

  test('renders without icon when not provided', () => {
    renderComponent()
    
    expect(screen.queryByTestId('mock-icon')).not.toBeInTheDocument()
  })

  test('renders with icon when provided', () => {
    renderComponent({ icon: MockIcon })
    
    const icon = screen.getByTestId('mock-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('mr-2', 'text-blue-500')
  })

  test('icon and title are properly aligned', () => {
    renderComponent({ icon: MockIcon })
    
    const title = screen.getByRole('heading', { level: 2 })
    const icon = screen.getByTestId('mock-icon')
    
    expect(title).toContainElement(icon)
    expect(title).toHaveClass('flex', 'flex-row', 'items-center')
  })

  test('renders with custom title and text', () => {
    const customProps = {
      title: 'Hire Top Talent',
      text: 'Connect with skilled professionals and grow your team.'
    }
    
    renderComponent(customProps)
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Hire Top Talent')
    expect(screen.getByText('Connect with skilled professionals and grow your team.')).toBeInTheDocument()
  })

  test('renders complete card with all props', () => {
    const props = {
      title: 'Complete Card',
      text: 'This card has everything.',
      href: '/complete',
      icon: MockIcon
    }
    
    renderComponent(props)
    
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Complete Card')
    expect(screen.getByText('This card has everything.')).toBeInTheDocument()
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Learn more →' })).toHaveAttribute('href', '/complete')
  })

  test('handles different href values', () => {
    const { rerender } = renderComponent({ href: '/jobs' })
    
    expect(screen.getByRole('link')).toHaveAttribute('href', '/jobs')
    
    rerender(
      <BrowserRouter>
        <LandingCard
          title="Test Card"
          text="Test text"
          href="/about-us"
        />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('link')).toHaveAttribute('href', '/about-us')
  })

  test('handles empty href string', () => {
    renderComponent({ href: '' })
    
    const link = screen.getByRole('link', { name: 'Learn more →' })
    expect(link).toHaveAttribute('href', '')
  })

  test('link navigates to correct path', () => {
    renderComponent({ href: '/careers' })
    
    const link = screen.getByRole('link', { name: 'Learn more →' })
    expect(link).toBeInTheDocument()
    expect(link.getAttribute('href')).toBe('/careers')
  })

  test('has semantic heading structure', () => {
    renderComponent()
    
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName.toLowerCase()).toBe('h2')
  })

  test('maintains proper content hierarchy', () => {
    renderComponent({ href: '/test' })
    
    const card = screen.getByRole('heading', { level: 2 }).closest('div')
    const heading = screen.getByRole('heading', { level: 2 })
    const text = screen.getByText(/Discover thousands/)
    const link = screen.getByRole('link', { name: 'Learn more →' })
    
    // Check order in DOM
    const children = Array.from(card!.children)
    expect(children.indexOf(heading)).toBeLessThan(children.indexOf(text))
    expect(children.indexOf(text)).toBeLessThan(children.indexOf(link))
  })

  test('handles long text content', () => {
    const longText = 'This is a very long text that might span multiple lines and should still be displayed correctly within the card component without breaking the layout or styling.'
    
    renderComponent({ text: longText })
    
    expect(screen.getByText(longText)).toBeInTheDocument()
    expect(screen.getByText(longText)).toHaveClass('text-gray-600')
  })

  test('handles special characters in title and text', () => {
    const props = {
      title: 'Jobs & Careers - 100% Remote',
      text: 'Find remote opportunities with companies like Google, Microsoft, & more!'
    }
    
    renderComponent(props)
    
    expect(screen.getByText('Jobs & Careers - 100% Remote')).toBeInTheDocument()
    expect(screen.getByText(/Find remote opportunities.*Google.*Microsoft/)).toBeInTheDocument()
  })

  test('icon receives correct className prop', () => {
    renderComponent({ icon: MockIcon })
    
    const icon = screen.getByTestId('mock-icon')
    expect(icon).toHaveClass('mr-2', 'text-blue-500')
  })

  test('works without React Router context when no href provided', () => {
    render(<LandingCard title="Test" text="Test text" />)
    
    expect(screen.getByText('Test')).toBeInTheDocument()
    expect(screen.getByText('Test text')).toBeInTheDocument()
  })

  test('card has hover effects', () => {
    renderComponent()
    
    const card = screen.getByRole('heading', { level: 2 }).closest('div')
    expect(card).toHaveClass('hover:shadow-lg', 'transition-shadow')
  })
})