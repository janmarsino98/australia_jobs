import { render, screen, waitFor } from '@testing-library/react'
import { useNavigate, useLocation } from 'react-router-dom'
import AuthGuard from '../AuthGuard'
import useAuthStore from '../../../stores/useAuthStore'

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}))

jest.mock('../../../stores/useAuthStore')
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className: string }) => (
    <div data-testid="loading-spinner" className={className}>Loading...</div>
  )
}))

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    disableAuthForTesting: false,
  }
}))

const mockNavigate = jest.fn()
const mockUseNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>
const mockUseLocation = useLocation as jest.MockedFunction<typeof useLocation>
const mockCheckSession = jest.fn()
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

const renderComponent = (props = {}) => {
  const defaultProps = {
    children: <div data-testid="protected-content">Protected Content</div>,
  }
  return render(<AuthGuard {...defaultProps} {...props} />)
}

describe('AuthGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseNavigate.mockReturnValue(mockNavigate)
    mockUseLocation.mockReturnValue({
      pathname: '/dashboard',
      search: '',
      hash: '',
      state: null,
      key: 'test-key',
    })
  })

  test('renders loading state initially', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    renderComponent()
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toHaveClass('w-8', 'h-8')
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  test('renders children when user is authenticated', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com', role: 'user' },
      checkSession: mockCheckSession,
    })
    
    renderComponent()
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
  })

  test('redirects to login when not authenticated', async () => {
    mockCheckSession.mockResolvedValue(false)
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    renderComponent()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/dashboard' }
      })
    })
  })

  test('calls checkSession when not authenticated', async () => {
    mockCheckSession.mockResolvedValue(true)
    mockUseAuthStore
      .mockReturnValueOnce({
        isAuthenticated: false,
        user: null,
        checkSession: mockCheckSession,
      })
      .mockReturnValueOnce({
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', role: 'user' },
        checkSession: mockCheckSession,
      })
    
    renderComponent()
    
    await waitFor(() => {
      expect(mockCheckSession).toHaveBeenCalledTimes(1)
    })
  })

  test('handles session check failure', async () => {
    const mockError = new Error('Session check failed')
    mockCheckSession.mockRejectedValue(mockError)
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    renderComponent()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/dashboard' }
      })
    })
    
    expect(consoleSpy).toHaveBeenCalledWith('❌ AuthGuard: Session check failed:', mockError)
    consoleSpy.mockRestore()
  })

  test('enforces role-based access control', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com', role: 'user' },
      checkSession: mockCheckSession,
    })
    
    renderComponent({ allowedRoles: ['admin', 'moderator'] })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized')
    })
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  test('allows access with correct role', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com', role: 'admin' },
      checkSession: mockCheckSession,
    })
    
    renderComponent({ allowedRoles: ['admin', 'moderator'] })
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('allows access when no roles specified', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com', role: 'user' },
      checkSession: mockCheckSession,
    })
    
    renderComponent({ allowedRoles: [] })
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  test('handles user without role when roles are required', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com' }, // No role property
      checkSession: mockCheckSession,
    })
    
    renderComponent({ allowedRoles: ['admin'] })
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/unauthorized')
    })
  })

  test('bypasses auth checks when testing mode is enabled', async () => {
    // Mock config to enable testing mode
    jest.doMock('../../../config', () => ({
      __esModule: true,
      default: {
        disableAuthForTesting: true,
      }
    }))
    
    // Re-import component to get updated config
    const { default: TestAuthGuard } = await import('../AuthGuard')
    
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    render(
      <TestAuthGuard>
        <div data-testid="protected-content">Protected Content</div>
      </TestAuthGuard>
    )
    
    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(mockCheckSession).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('preserves current path in navigation state', async () => {
    mockUseLocation.mockReturnValue({
      pathname: '/profile/settings',
      search: '?tab=security',
      hash: '#notifications',
      state: null,
      key: 'test-key',
    })
    
    mockCheckSession.mockResolvedValue(false)
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    renderComponent()
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { from: '/profile/settings' }
      })
    })
  })

  test('shows loading spinner with correct styling', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkSession: mockCheckSession,
    })
    
    renderComponent()
    
    const container = screen.getByTestId('loading-spinner').closest('div')
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
  })

  test('handles successful session validation', async () => {
    mockCheckSession.mockResolvedValue(true)
    
    // Mock the store to return false initially, then true after checkSession
    let callCount = 0
    mockUseAuthStore.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return {
          isAuthenticated: false,
          user: null,
          checkSession: mockCheckSession,
        }
      }
      return {
        isAuthenticated: true,
        user: { _id: '123', email: 'test@example.com', role: 'user' },
        checkSession: mockCheckSession,
      }
    })
    
    renderComponent()
    
    await waitFor(() => {
      expect(mockCheckSession).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
  })

  test('does not run auth check multiple times', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: { _id: '123', email: 'test@example.com', role: 'user' },
      checkSession: mockCheckSession,
    })
    
    const { rerender } = renderComponent()
    
    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    })
    
    // Rerender shouldn't trigger another auth check
    rerender(
      <AuthGuard>
        <div data-testid="protected-content">Updated Content</div>
      </AuthGuard>
    )
    
    expect(mockCheckSession).toHaveBeenCalledTimes(1)
  })
})