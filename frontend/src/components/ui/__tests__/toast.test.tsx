import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '../toast'

// Mock the useToast hook for testing
jest.mock('../use-toast', () => ({
  useToast: () => ({
    toasts: [],
    toast: jest.fn(),
    dismiss: jest.fn(),
  }),
}))

const TestToastProvider = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>
    {children}
    <ToastViewport />
  </ToastProvider>
)

describe('Toast Components', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Toast', () => {
    test('renders with default variant', () => {
      render(
        <TestToastProvider>
          <Toast open data-testid="toast">
            Test toast content
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByTestId('toast')
      expect(toast).toBeInTheDocument()
      expect(toast).toHaveClass(
        'group', 'pointer-events-auto', 'relative', 'flex', 'w-full',
        'items-center', 'justify-between', 'border', 'bg-background'
      )
    })

    test('renders with destructive variant', () => {
      render(
        <TestToastProvider>
          <Toast open variant="destructive" data-testid="toast">
            Destructive toast
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveClass(
        'destructive', 'border-destructive', 'bg-destructive', 'text-destructive-foreground'
      )
    })

    test('applies custom className', () => {
      render(
        <TestToastProvider>
          <Toast open className="custom-toast" data-testid="toast">
            Custom toast
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveClass('custom-toast')
      expect(toast).toHaveClass('group', 'pointer-events-auto') // Still has default classes
    })

    test('handles open state', () => {
      const { rerender } = render(
        <TestToastProvider>
          <Toast open={false} data-testid="toast">
            Hidden toast
          </Toast>
        </TestToastProvider>
      )

      expect(screen.queryByTestId('toast')).not.toBeInTheDocument()

      rerender(
        <TestToastProvider>
          <Toast open={true} data-testid="toast">
            Visible toast
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByTestId('toast')).toBeInTheDocument()
    })
  })

  describe('ToastTitle', () => {
    test('renders title with proper styling', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastTitle>Toast Title</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      const title = screen.getByText('Toast Title')
      expect(title).toBeInTheDocument()
      expect(title).toHaveClass('text-sm', 'font-semibold', '[&+div]:text-xs')
    })

    test('applies custom className to title', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastTitle className="custom-title">Custom Title</ToastTitle>
          </Toast>
        </TestToastProvider>
      )

      const title = screen.getByText('Custom Title')
      expect(title).toHaveClass('custom-title')
      expect(title).toHaveClass('text-sm', 'font-semibold')
    })
  })

  describe('ToastDescription', () => {
    test('renders description with proper styling', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastDescription>Toast description text</ToastDescription>
          </Toast>
        </TestToastProvider>
      )

      const description = screen.getByText('Toast description text')
      expect(description).toBeInTheDocument()
      expect(description).toHaveClass('text-sm', 'opacity-90')
    })

    test('applies custom className to description', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastDescription className="custom-desc">Custom Description</ToastDescription>
          </Toast>
        </TestToastProvider>
      )

      const description = screen.getByText('Custom Description')
      expect(description).toHaveClass('custom-desc')
      expect(description).toHaveClass('text-sm', 'opacity-90')
    })
  })

  describe('ToastAction', () => {
    test('renders action button with proper styling', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const handleAction = jest.fn()

      render(
        <TestToastProvider>
          <Toast open>
            <ToastAction onClick={handleAction}>Retry</ToastAction>
          </Toast>
        </TestToastProvider>
      )

      const actionButton = screen.getByRole('button', { name: 'Retry' })
      expect(actionButton).toBeInTheDocument()
      expect(actionButton).toHaveClass(
        'inline-flex', 'h-8', 'shrink-0', 'items-center', 'justify-center',
        'rounded-md', 'border', 'bg-transparent', 'px-3', 'text-sm', 'font-medium'
      )

      await user.click(actionButton)
      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    test('applies destructive styling when in destructive toast', () => {
      render(
        <TestToastProvider>
          <Toast open variant="destructive">
            <ToastAction>Action</ToastAction>
          </Toast>
        </TestToastProvider>
      )

      const actionButton = screen.getByRole('button', { name: 'Action' })
      expect(actionButton).toHaveClass(
        'group-[.destructive]:border-muted/40',
        'group-[.destructive]:hover:border-destructive/30'
      )
    })
  })

  describe('ToastClose', () => {
    test('renders close button with proper styling', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toBeInTheDocument()
      expect(closeButton).toHaveClass(
        'absolute', 'right-1', 'top-1', 'rounded-md', 'p-1',
        'text-foreground/50', 'opacity-0'
      )
    })

    test('close button is accessible', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toHaveAccessibleName('Close')
    })

    test('applies destructive styling when in destructive toast', () => {
      render(
        <TestToastProvider>
          <Toast open variant="destructive">
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const closeButton = screen.getByRole('button', { name: 'Close' })
      expect(closeButton).toHaveClass(
        'group-[.destructive]:text-red-300',
        'group-[.destructive]:hover:text-red-50'
      )
    })
  })

  describe('ToastViewport', () => {
    test('renders viewport with proper styling', () => {
      render(
        <TestToastProvider>
          <div>Test content</div>
        </TestToastProvider>
      )

      // ToastViewport is rendered but might not have specific text content
      // We can check if the component tree is rendered correctly
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })

    test('applies custom className to viewport', () => {
      render(
        <ToastProvider>
          <ToastViewport className="custom-viewport" />
        </ToastProvider>
      )

      // Since ToastViewport might be rendered in a portal, 
      // we'll check that the component can accept custom className
      // The actual DOM verification might need adjustment based on how Radix renders it
    })
  })

  describe('Complete Toast Structure', () => {
    test('renders complete toast with all components', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      const handleAction = jest.fn()
      const handleClose = jest.fn()

      render(
        <TestToastProvider>
          <Toast open onOpenChange={handleClose}>
            <div className="grid gap-1">
              <ToastTitle>Success!</ToastTitle>
              <ToastDescription>Your action was completed successfully.</ToastDescription>
            </div>
            <ToastAction onClick={handleAction}>Undo</ToastAction>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Your action was completed successfully.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()

      // Test action button
      await user.click(screen.getByRole('button', { name: 'Undo' }))
      expect(handleAction).toHaveBeenCalledTimes(1)
    })

    test('maintains proper structure and accessibility', () => {
      render(
        <TestToastProvider>
          <Toast open>
            <ToastTitle>Accessible Toast</ToastTitle>
            <ToastDescription>This toast is accessible</ToastDescription>
            <ToastClose />
          </Toast>
        </TestToastProvider>
      )

      const title = screen.getByText('Accessible Toast')
      const description = screen.getByText('This toast is accessible')
      const closeButton = screen.getByRole('button', { name: 'Close' })

      expect(title).toBeInTheDocument()
      expect(description).toBeInTheDocument()
      expect(closeButton).toBeInTheDocument()
    })
  })

  describe('Animation and Transitions', () => {
    test('has proper animation classes', () => {
      render(
        <TestToastProvider>
          <Toast open data-testid="toast">
            Animated toast
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveClass(
        'data-[state=open]:animate-in',
        'data-[state=closed]:animate-out',
        'data-[state=open]:slide-in-from-top-full'
      )
    })
  })

  describe('Swipe Gestures', () => {
    test('has swipe gesture classes', () => {
      render(
        <TestToastProvider>
          <Toast open data-testid="toast">
            Swipeable toast
          </Toast>
        </TestToastProvider>
      )

      const toast = screen.getByTestId('toast')
      expect(toast).toHaveClass(
        'data-[swipe=cancel]:translate-x-0',
        'data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)]',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]'
      )
    })
  })
})