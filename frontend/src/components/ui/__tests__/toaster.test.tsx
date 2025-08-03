import { render, screen, act, renderHook } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Toaster } from '../toaster'
import { useToast, toast } from '../use-toast'

// Mock ToastProvider and related components to avoid Radix UI portal issues in tests
jest.mock('../toast', () => ({
  Toast: ({ children, ...props }: any) => <div data-testid="toast" {...props}>{children}</div>,
  ToastClose: () => <button data-testid="toast-close">Close</button>,
  ToastDescription: ({ children }: any) => <div data-testid="toast-description">{children}</div>,
  ToastTitle: ({ children }: any) => <div data-testid="toast-title">{children}</div>,
  ToastViewport: () => <div data-testid="toast-viewport" />,
}))

describe('Toaster Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Clear any existing toasts
    const { result } = renderHook(() => useToast())
    act(() => {
      result.current.dismiss()
    })
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('renders empty toaster when no toasts', () => {
    render(<Toaster />)
    
    expect(screen.getByTestId('toast-viewport')).toBeInTheDocument()
    expect(screen.queryByTestId('toast')).not.toBeInTheDocument()
  })

  test('renders toast when added via useToast hook', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          title: 'Test Toast',
          description: 'This is a test toast',
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Test Toast')
    expect(screen.getByTestId('toast-description')).toHaveTextContent('This is a test toast')
    expect(screen.getByTestId('toast-close')).toBeInTheDocument()
  })

  test('renders multiple toasts when added', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          title: 'First Toast',
          description: 'First description',
        })
        triggerToast({
          title: 'Second Toast', 
          description: 'Second description',
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    const toasts = screen.getAllByTestId('toast')
    expect(toasts).toHaveLength(2)
  })

  test('renders toast with action', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          title: 'Toast with Action',
          description: 'This toast has an action',
          action: <button data-testid="toast-action">Retry</button>
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Toast with Action')
    expect(screen.getByTestId('toast-action')).toBeInTheDocument()
    expect(screen.getByTestId('toast-action')).toHaveTextContent('Retry')
  })

  test('renders toast without title', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          description: 'Description only toast',
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    expect(screen.queryByTestId('toast-title')).not.toBeInTheDocument()
    expect(screen.getByTestId('toast-description')).toHaveTextContent('Description only toast')
  })

  test('renders toast without description', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          title: 'Title only toast',
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    expect(screen.getByTestId('toast-title')).toHaveTextContent('Title only toast')
    expect(screen.queryByTestId('toast-description')).not.toBeInTheDocument()
  })

  test('passes toast props correctly', () => {
    const TestComponent = () => {
      const { toast: triggerToast } = useToast()
      
      React.useEffect(() => {
        triggerToast({
          title: 'Variant Toast',
          description: 'This is a destructive toast',
          variant: 'destructive',
          className: 'custom-toast-class'
        })
      }, [triggerToast])
      
      return <Toaster />
    }

    render(<TestComponent />)
    
    const toast = screen.getByTestId('toast')
    expect(toast).toHaveClass('custom-toast-class')
    expect(toast).toHaveAttribute('variant', 'destructive')
  })
})

describe('useToast Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('returns toast function and toasts array', () => {
    const { result } = renderHook(() => useToast())
    
    expect(typeof result.current.toast).toBe('function')
    expect(Array.isArray(result.current.toasts)).toBe(true)
    expect(typeof result.current.dismiss).toBe('function')
  })

  test('adds toast when toast function is called', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description'
      })
    })
    
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].description).toBe('Test description')
  })

  test('assigns unique id to each toast', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
    })
    
    expect(result.current.toasts).toHaveLength(2)
    expect(result.current.toasts[0].id).not.toBe(result.current.toasts[1].id)
  })

  test('dismisses specific toast by id', () => {
    const { result } = renderHook(() => useToast())
    
    let toastId: string
    act(() => {
      const toastResult = result.current.toast({ title: 'Toast 1' })
      toastId = toastResult.id
      result.current.toast({ title: 'Toast 2' })
    })
    
    expect(result.current.toasts).toHaveLength(2)
    
    act(() => {
      result.current.dismiss(toastId!)
    })
    
    // Check that the specific toast is marked as closed
    const dismissedToast = result.current.toasts.find(t => t.id === toastId)
    expect(dismissedToast?.open).toBe(false)
  })

  test('dismisses all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
    })
    
    expect(result.current.toasts).toHaveLength(2)
    
    act(() => {
      result.current.dismiss()
    })
    
    // All toasts should be marked as closed
    result.current.toasts.forEach(toast => {
      expect(toast.open).toBe(false)
    })
  })

  test('respects toast limit', () => {
    const { result } = renderHook(() => useToast())
    
    act(() => {
      result.current.toast({ title: 'Toast 1' })
      result.current.toast({ title: 'Toast 2' })
      result.current.toast({ title: 'Toast 3' })
    })
    
    // Should only keep the most recent toast due to TOAST_LIMIT = 1
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Toast 3')
  })

  test('toast function returns control methods', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControl: any
    act(() => {
      toastControl = result.current.toast({ title: 'Controllable Toast' })
    })
    
    expect(toastControl).toHaveProperty('id')
    expect(toastControl).toHaveProperty('dismiss')
    expect(toastControl).toHaveProperty('update')
    expect(typeof toastControl.dismiss).toBe('function')
    expect(typeof toastControl.update).toBe('function')
  })

  test('can update toast using returned update function', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControl: any
    act(() => {
      toastControl = result.current.toast({ 
        title: 'Original Title',
        description: 'Original Description'
      })
    })
    
    act(() => {
      toastControl.update({
        title: 'Updated Title',
        description: 'Updated Description'
      })
    })
    
    const updatedToast = result.current.toasts.find(t => t.id === toastControl.id)
    expect(updatedToast?.title).toBe('Updated Title')
    expect(updatedToast?.description).toBe('Updated Description')
  })

  test('can dismiss toast using returned dismiss function', () => {
    const { result } = renderHook(() => useToast())
    
    let toastControl: any
    act(() => {
      toastControl = result.current.toast({ title: 'Dismissible Toast' })
    })
    
    expect(result.current.toasts[0].open).toBe(true)
    
    act(() => {
      toastControl.dismiss()
    })
    
    const dismissedToast = result.current.toasts.find(t => t.id === toastControl.id)
    expect(dismissedToast?.open).toBe(false)
  })
})

describe('toast function (standalone)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('can be called independently', () => {
    const toastResult = toast({ title: 'Standalone Toast' })
    
    expect(toastResult).toHaveProperty('id')
    expect(toastResult).toHaveProperty('dismiss')
    expect(toastResult).toHaveProperty('update')
  })

  test('generates unique ids for standalone toasts', () => {
    const toast1 = toast({ title: 'Toast 1' })
    const toast2 = toast({ title: 'Toast 2' })
    
    expect(toast1.id).not.toBe(toast2.id)
  })
})