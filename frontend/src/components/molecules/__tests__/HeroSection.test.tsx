import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeroSection } from '../HeroSection'

// Mock the Button component
jest.mock('../../ui/button', () => ({
  Button: ({ children, onClick, className, size }: any) => (
    <button 
      onClick={onClick}
      className={className}
      data-size={size}
      data-testid="hero-button"
    >
      {children}
    </button>
  )
}))

const renderComponent = (props = {}) => {
  const defaultProps = {
    title: 'Find Your Dream Job',
    subtitle: 'Connect with top employers across Australia',
  }
  return render(<HeroSection {...defaultProps} {...props} />)
}

describe('HeroSection', () => {
  test('renders hero content correctly', () => {
    renderComponent()
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Find Your Dream Job')
    expect(screen.getByText('Connect with top employers across Australia')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const customClass = 'custom-hero-class'
    renderComponent({ className: customClass })
    
    const section = screen.getByRole('heading', { level: 1 }).closest('section')
    expect(section).toHaveClass(customClass)
  })

  test('has default gradient background styling', () => {
    renderComponent()
    
    const section = screen.getByRole('heading', { level: 1 }).closest('section')
    expect(section).toHaveClass(
      'px-6',
      'py-4',
      'bg-gradient-to-r',
      'from-main-text',
      'to-searchbar-text',
      'text-white'
    )
  })

  test('has responsive container styling', () => {
    renderComponent()
    
    const container = screen.getByRole('heading', { level: 1 }).closest('div')
    expect(container).toHaveClass(
      'max-w-6xl',
      'mx-auto',
      'text-center',
      'py-[60px]'
    )
  })

  test('title has correct styling', () => {
    renderComponent()
    
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveClass('text-4xl', 'font-bold', 'mb-6')
  })

  test('subtitle has correct styling', () => {
    renderComponent()
    
    const subtitle = screen.getByText('Connect with top employers across Australia')
    expect(subtitle).toHaveClass('text-xl', 'mb-8', 'max-w-3xl', 'mx-auto')
  })

  test('does not render actions when none provided', () => {
    renderComponent()
    
    expect(screen.queryByTestId('hero-button')).not.toBeInTheDocument()
  })

  test('does not render actions when empty array provided', () => {
    renderComponent({ actions: [] })
    
    expect(screen.queryByTestId('hero-button')).not.toBeInTheDocument()
  })

  test('renders single action button', () => {
    const mockAction = jest.fn()
    const actions = [
      { label: 'Get Started', onClick: mockAction }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Get Started')
  })

  test('renders multiple action buttons', () => {
    const mockAction1 = jest.fn()
    const mockAction2 = jest.fn()
    const actions = [
      { label: 'Get Started', onClick: mockAction1 },
      { label: 'Learn More', onClick: mockAction2, variant: 'secondary' as const }
    ]
    
    renderComponent({ actions })
    
    const buttons = screen.getAllByTestId('hero-button')
    expect(buttons).toHaveLength(2)
    expect(buttons[0]).toHaveTextContent('Get Started')
    expect(buttons[1]).toHaveTextContent('Learn More')
  })

  test('handles primary button clicks', async () => {
    const user = userEvent.setup()
    const mockAction = jest.fn()
    const actions = [
      { label: 'Get Started', onClick: mockAction }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    await user.click(button)
    
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  test('handles secondary button clicks', async () => {
    const user = userEvent.setup()
    const mockAction = jest.fn()
    const actions = [
      { label: 'Learn More', onClick: mockAction, variant: 'secondary' as const }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    await user.click(button)
    
    expect(mockAction).toHaveBeenCalledTimes(1)
  })

  test('applies primary button styling by default', () => {
    const actions = [
      { label: 'Get Started', onClick: jest.fn() }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    expect(button).toHaveClass('bg-white', 'text-main-text', 'hover:bg-gray-100')
  })

  test('applies secondary button styling when specified', () => {
    const actions = [
      { label: 'Learn More', onClick: jest.fn(), variant: 'secondary' as const }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    expect(button).toHaveClass(
      'bg-transparent',
      'border-2',
      'border-white',
      'text-white',
      'hover:bg-white',
      'hover:text-main-text'
    )
  })

  test('buttons have large size', () => {
    const actions = [
      { label: 'Get Started', onClick: jest.fn() }
    ]
    
    renderComponent({ actions })
    
    const button = screen.getByTestId('hero-button')
    expect(button).toHaveAttribute('data-size', 'lg')
  })

  test('action buttons container has correct layout styling', () => {
    const actions = [
      { label: 'Get Started', onClick: jest.fn() }
    ]
    
    renderComponent({ actions })
    
    const buttonContainer = screen.getByTestId('hero-button').closest('div')
    expect(buttonContainer).toHaveClass('flex', 'gap-4', 'justify-center', 'flex-wrap')
  })

  test('handles multiple actions with different variants', async () => {
    const user = userEvent.setup()
    const mockPrimary = jest.fn()
    const mockSecondary = jest.fn()
    const actions = [
      { label: 'Get Started', onClick: mockPrimary },
      { label: 'Learn More', onClick: mockSecondary, variant: 'secondary' as const }
    ]
    
    renderComponent({ actions })
    
    const buttons = screen.getAllByTestId('hero-button')
    
    // Primary button
    expect(buttons[0]).toHaveClass('bg-white', 'text-main-text', 'hover:bg-gray-100')
    await user.click(buttons[0])
    expect(mockPrimary).toHaveBeenCalledTimes(1)
    
    // Secondary button
    expect(buttons[1]).toHaveClass('bg-transparent', 'border-2', 'border-white')
    await user.click(buttons[1])
    expect(mockSecondary).toHaveBeenCalledTimes(1)
  })

  test('renders with different title and subtitle', () => {
    const customProps = {
      title: 'Join Our Platform',
      subtitle: 'Discover exciting opportunities in your field'
    }
    
    renderComponent(customProps)
    
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Join Our Platform')
    expect(screen.getByText('Discover exciting opportunities in your field')).toBeInTheDocument()
  })

  test('action buttons use correct key indices', () => {
    const actions = [
      { label: 'Action 1', onClick: jest.fn() },
      { label: 'Action 2', onClick: jest.fn() },
      { label: 'Action 3', onClick: jest.fn() }
    ]
    
    renderComponent({ actions })
    
    const buttons = screen.getAllByTestId('hero-button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]).toHaveTextContent('Action 1')
    expect(buttons[1]).toHaveTextContent('Action 2')
    expect(buttons[2]).toHaveTextContent('Action 3')
  })

  test('is a semantic section element', () => {
    renderComponent()
    
    const section = screen.getByRole('heading', { level: 1 }).closest('section')
    expect(section).toBeInTheDocument()
    expect(section?.tagName.toLowerCase()).toBe('section')
  })

  test('has accessible heading hierarchy', () => {
    renderComponent()
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    
    // Subtitle should be a paragraph, not a heading
    const subtitle = screen.getByText('Connect with top employers across Australia')
    expect(subtitle.tagName.toLowerCase()).toBe('p')
  })
})