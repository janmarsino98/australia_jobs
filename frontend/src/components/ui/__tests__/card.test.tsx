import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../card'

describe('Card Components', () => {
  describe('Card', () => {
    test('renders with default styling', () => {
      render(<Card data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass(
        'rounded-lg', 'border', 'bg-card', 'text-card-foreground', 'shadow-sm'
      )
    })

    test('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
      expect(card).toHaveClass('rounded-lg', 'border') // Still has default classes
    })

    test('forwards ref correctly', () => {
      const ref = jest.fn()
      render(<Card ref={ref}>Card</Card>)
      expect(ref).toHaveBeenCalled()
    })

    test('accepts HTML div attributes', () => {
      render(
        <Card 
          id="test-card"
          role="article"
          aria-label="Test card"
          data-testid="card"
        >
          Content
        </Card>
      )
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'test-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-label', 'Test card')
    })
  })

  describe('CardHeader', () => {
    test('renders with proper styling', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toBeInTheDocument()
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })

    test('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
    })
  })

  describe('CardTitle', () => {
    test('renders as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Card Title')
      expect(title).toHaveClass(
        'text-2xl', 'font-semibold', 'leading-none', 'tracking-tight'
      )
    })

    test('renders as specified heading level', () => {
      render(<CardTitle as="h1">H1 Title</CardTitle>)
      const title = screen.getByRole('heading', { level: 1 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('H1 Title')
    })

    test('supports all heading levels', () => {
      const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const
      
      headingLevels.forEach((level, index) => {
        const { unmount } = render(<CardTitle as={level}>Title {level}</CardTitle>)
        const title = screen.getByRole('heading', { level: index + 1 })
        expect(title).toBeInTheDocument()
        unmount()
      })
    })

    test('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>)
      const title = screen.getByRole('heading')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('text-2xl', 'font-semibold')
    })
  })

  describe('CardDescription', () => {
    test('renders as paragraph with correct styling', () => {
      render(<CardDescription>This is a description</CardDescription>)
      const description = screen.getByText('This is a description')
      expect(description).toBeInTheDocument()
      expect(description.tagName).toBe('P')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    test('applies custom className', () => {
      render(<CardDescription className="custom-desc">Description</CardDescription>)
      const description = screen.getByText('Description')
      expect(description).toHaveClass('custom-desc')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })
  })

  describe('CardContent', () => {
    test('renders with proper styling', () => {
      render(<CardContent data-testid="content">Content area</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toBeInTheDocument()
      expect(content).toHaveClass('p-6', 'pt-0')
    })

    test('applies custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('CardFooter', () => {
    test('renders with proper styling', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toBeInTheDocument()
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })

    test('applies custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('custom-footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6')
    })
  })

  describe('Full Card Composition', () => {
    test('renders complete card structure', () => {
      render(
        <Card data-testid="full-card">
          <CardHeader>
            <CardTitle>Test Card</CardTitle>
            <CardDescription>This is a test card description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Main content goes here</p>
          </CardContent>
          <CardFooter>
            <button>Action Button</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('full-card')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Test Card' })).toBeInTheDocument()
      expect(screen.getByText('This is a test card description')).toBeInTheDocument()
      expect(screen.getByText('Main content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument()
    })

    test('maintains proper structure and hierarchy', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle as="h2">Card Title</CardTitle>
            <CardDescription>Card description</CardDescription>
          </CardHeader>
          <CardContent>
            Card content
          </CardContent>
          <CardFooter>
            Card footer
          </CardFooter>
        </Card>
      )

      const card = screen.getByRole('heading').closest('div')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card')
      
      const title = screen.getByRole('heading', { level: 2 })
      expect(title).toHaveTextContent('Card Title')
      
      const description = screen.getByText('Card description')
      expect(description.tagName).toBe('P')
    })
  })

  describe('Accessibility', () => {
    test('supports ARIA attributes', () => {
      render(
        <Card 
          role="article"
          aria-labelledby="card-title"
          aria-describedby="card-desc"
          data-testid="accessible-card"
        >
          <CardHeader>
            <CardTitle id="card-title">Accessible Card</CardTitle>
            <CardDescription id="card-desc">Accessible description</CardDescription>
          </CardHeader>
        </Card>
      )

      const card = screen.getByTestId('accessible-card')
      expect(card).toHaveAttribute('role', 'article')
      expect(card).toHaveAttribute('aria-labelledby', 'card-title')
      expect(card).toHaveAttribute('aria-describedby', 'card-desc')
    })

    test('heading hierarchy is maintained', () => {
      render(
        <Card>
          <CardTitle as="h1">Main Title</CardTitle>
          <CardTitle as="h2">Sub Title</CardTitle>
        </Card>
      )

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Main Title')
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Sub Title')
    })
  })
})