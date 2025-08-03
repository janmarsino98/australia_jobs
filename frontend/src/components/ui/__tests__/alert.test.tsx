import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Alert, AlertDescription, AlertTitle } from '../alert'

// Mock lucide-react icons
const MockIcon = () => <svg data-testid="alert-icon">Icon</svg>

describe('Alert Components', () => {
  describe('Alert', () => {
    test('renders with default variant', () => {
      render(<Alert data-testid="alert">Alert content</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toBeInTheDocument()
      expect(alert).toHaveAttribute('role', 'alert')
      expect(alert).toHaveClass(
        'relative', 'w-full', 'rounded-lg', 'border', 'p-4',
        'bg-background', 'text-foreground'
      )
    })

    test('renders with destructive variant', () => {
      render(<Alert variant="destructive" data-testid="alert">Destructive alert</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass(
        'border-destructive/50', 'text-destructive', 'dark:border-destructive'
      )
    })

    test('applies custom className', () => {
      render(<Alert className="custom-alert" data-testid="alert">Custom alert</Alert>)
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('custom-alert')
      expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg') // Still has default classes
    })

    test('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<Alert ref={ref}>Alert with ref</Alert>)
      expect(ref).toHaveBeenCalled()
    })

    test('supports HTML div attributes', () => {
      render(
        <Alert 
          id="test-alert"
          data-custom="test"
          aria-label="Custom alert"
          data-testid="alert"
        >
          Alert content
        </Alert>
      )
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveAttribute('id', 'test-alert')
      expect(alert).toHaveAttribute('data-custom', 'test')
      expect(alert).toHaveAttribute('aria-label', 'Custom alert')
    })

    test('has proper icon styling classes', () => {
      render(
        <Alert data-testid="alert">
          <MockIcon />
          Alert with icon
        </Alert>
      )
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass(
        '[&>svg~*]:pl-7',
        '[&>svg+div]:translate-y-[-3px]',
        '[&>svg]:absolute',
        '[&>svg]:left-4',
        '[&>svg]:top-4',
        '[&>svg]:text-foreground'
      )
    })
  })

  describe('AlertTitle', () => {
    test('renders as h5 with proper styling', () => {
      render(<AlertTitle>Alert Title</AlertTitle>)
      const title = screen.getByRole('heading', { level: 5 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Alert Title')
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none', 'tracking-tight')
    })

    test('applies custom className', () => {
      render(<AlertTitle className="custom-title">Custom Title</AlertTitle>)
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('mb-1', 'font-medium', 'leading-none')
    })

    test('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<AlertTitle ref={ref}>Title with ref</AlertTitle>)
      expect(ref).toHaveBeenCalled()
    })

    test('supports HTML heading attributes', () => {
      render(
        <AlertTitle 
          id="alert-title"
          data-testid="title"
        >
          Titled Alert
        </AlertTitle>
      )
      const title = screen.getByTestId('title')
      expect(title).toHaveAttribute('id', 'alert-title')
    })
  })

  describe('AlertDescription', () => {
    test('renders as div with proper styling', () => {
      render(<AlertDescription data-testid="description">Alert description</AlertDescription>)
      const description = screen.getByTestId('description')
      expect(description).toBeInTheDocument()
      expect(description).toHaveTextContent('Alert description')
      expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed')
    })

    test('applies custom className', () => {
      render(<AlertDescription className="custom-desc" data-testid="description">Description</AlertDescription>)
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('custom-desc')
      expect(description).toHaveClass('text-sm', '[&_p]:leading-relaxed')
    })

    test('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<AlertDescription ref={ref}>Description with ref</AlertDescription>)
      expect(ref).toHaveBeenCalled()
    })

    test('supports HTML div attributes', () => {
      render(
        <AlertDescription 
          id="alert-desc"
          data-testid="description"
        >
          Alert Description
        </AlertDescription>
      )
      const description = screen.getByTestId('description')
      expect(description).toHaveAttribute('id', 'alert-desc')
    })

    test('handles paragraph content with proper styling', () => {
      render(
        <AlertDescription data-testid="description">
          <p>First paragraph</p>
          <p>Second paragraph</p>
        </AlertDescription>
      )
      const description = screen.getByTestId('description')
      const paragraphs = description.querySelectorAll('p')
      expect(paragraphs).toHaveLength(2)
      expect(description).toHaveClass('[&_p]:leading-relaxed')
    })
  })

  describe('Complete Alert Structure', () => {
    test('renders complete alert with icon, title, and description', () => {
      render(
        <Alert data-testid="complete-alert">
          <MockIcon />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>This is a warning message with important information.</AlertDescription>
        </Alert>
      )

      expect(screen.getByTestId('complete-alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Warning' })).toBeInTheDocument()
      expect(screen.getByText('This is a warning message with important information.')).toBeInTheDocument()
    })

    test('renders destructive alert with all components', () => {
      render(
        <Alert variant="destructive" data-testid="destructive-alert">
          <MockIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Something went wrong. Please try again.</AlertDescription>
        </Alert>
      )

      const alert = screen.getByTestId('destructive-alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
      expect(screen.getByRole('heading', { name: 'Error' })).toBeInTheDocument()
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })

    test('maintains proper accessibility', () => {
      render(
        <Alert aria-labelledby="alert-title" aria-describedby="alert-desc">
          <AlertTitle id="alert-title">Important Notice</AlertTitle>
          <AlertDescription id="alert-desc">Please read this carefully.</AlertDescription>
        </Alert>
      )

      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-labelledby', 'alert-title')
      expect(alert).toHaveAttribute('aria-describedby', 'alert-desc')
    })

    test('alert without title works correctly', () => {
      render(
        <Alert data-testid="no-title-alert">
          <MockIcon />
          <AlertDescription>Alert without title</AlertDescription>
        </Alert>
      )

      expect(screen.getByTestId('no-title-alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByText('Alert without title')).toBeInTheDocument()
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    test('alert without description works correctly', () => {
      render(
        <Alert data-testid="no-desc-alert">
          <MockIcon />
          <AlertTitle>Title Only</AlertTitle>
        </Alert>
      )

      expect(screen.getByTestId('no-desc-alert')).toBeInTheDocument()
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Title Only' })).toBeInTheDocument()
    })

    test('alert without icon works correctly', () => {
      render(
        <Alert data-testid="no-icon-alert">
          <AlertTitle>No Icon Alert</AlertTitle>
          <AlertDescription>This alert has no icon</AlertDescription>
        </Alert>
      )

      expect(screen.getByTestId('no-icon-alert')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'No Icon Alert' })).toBeInTheDocument()
      expect(screen.getByText('This alert has no icon')).toBeInTheDocument()
      expect(screen.queryByTestId('alert-icon')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    test('alert has proper role attribute', () => {
      render(<Alert>Accessible alert</Alert>)
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })

    test('supports custom ARIA attributes', () => {
      render(
        <Alert 
          aria-live="polite"
          aria-atomic="true"
          data-testid="aria-alert"
        >
          ARIA Alert
        </Alert>
      )
      const alert = screen.getByTestId('aria-alert')
      expect(alert).toHaveAttribute('aria-live', 'polite')
      expect(alert).toHaveAttribute('aria-atomic', 'true')
    })
  })
})