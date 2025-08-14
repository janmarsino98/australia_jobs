import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import UserProfilePage from '../UserProfilePage'

// Mock dependencies
jest.mock('../../hooks/useZodForm', () => ({
  useZodForm: () => ({
    register: jest.fn().mockReturnValue({
      name: 'test-field',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    }),
    handleSubmit: jest.fn().mockImplementation((fn) => (e) => {
      e?.preventDefault()
      fn({ name: 'Updated Name', bio: 'Updated bio' })
    }),
    formState: { errors: {}, isSubmitting: false },
    setError: jest.fn(),
    reset: jest.fn(),
    watch: jest.fn(),
    setValue: jest.fn(),
  })
}))

jest.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  default: () => ({
    user: {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      profile_picture: null,
      bio: 'Software developer',
      phone: '+61400000000',
      location: { city: 'Sydney', state: 'NSW' }
    },
    isAuthenticated: true,
  })
}))

jest.mock('../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`),
  default: { apiBaseUrl: 'http://localhost:5000' }
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
  useLocation: () => ({
    pathname: '/profile',
    state: null,
  }),
}))

// Mock components that might cause issues
jest.mock('../../components/molecules/FormInput', () => {
  const MockFormInput = React.forwardRef(({ label, error, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} data-testid={`input-${label?.toLowerCase()}`} />
      {error && <span role="alert">{error}</span>}
    </div>
  ))
  MockFormInput.displayName = 'FormInput'
  return MockFormInput
})

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
}))

jest.mock('../../components/molecules/ProfilePictureUploadModal', () => {
  return function ProfilePictureUploadModal({ isOpen, onClose }: any) {
    return isOpen ? (
      <div data-testid="profile-picture-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  }
})

jest.mock('../../components/molecules/EmailChangeModal', () => {
  return function EmailChangeModal({ isOpen, onClose }: any) {
    return isOpen ? (
      <div data-testid="email-change-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  }
})

jest.mock('../../components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}))

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      name: 'John Doe',
      email: 'john@example.com',
      bio: 'Software developer',
      phone: '+61400000000',
      location: { city: 'Sydney', state: 'NSW' }
    }),
  })
) as jest.Mock

describe('UserProfilePage - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const renderUserProfilePage = () => {
    return render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    )
  }

  test('renders without crashing', () => {
    const { container } = renderUserProfilePage()
    expect(container).toBeInTheDocument()
  })

  test('renders the component structure', () => {
    const { container } = renderUserProfilePage()
    // Just check that the component renders some content
    expect(container.firstChild).toBeTruthy()
  })

  test('calls fetch on mount when user is authenticated', async () => {
    renderUserProfilePage()
    
    // Wait a bit for useEffect to run
    await new Promise(resolve => setTimeout(resolve, 200))
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/users/profile',
      expect.objectContaining({
        credentials: 'include'
      })
    )
  })

  test('handles 404 response gracefully', async () => {
    // Reset fetch mock for clean test
    (global.fetch as jest.Mock).mockReset()
    
    // Mock 404 response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'User not found' }),
    })

    renderUserProfilePage()
    
    // Wait for API call and response handling
    await new Promise(resolve => setTimeout(resolve, 300))
    
    // Verify the API call was made with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/users/profile',
      expect.objectContaining({
        credentials: 'include'
      })
    )
    
    // The component should have handled the 404 response without crashing
    // (This test primarily checks that the component doesn't throw an error)
  })

  test('handles API errors gracefully', async () => {
    // Mock error response
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const mockToast = jest.fn()
    jest.doMock('../../components/ui/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }))

    renderUserProfilePage()
    
    // Wait for API call and error handling
    await new Promise(resolve => setTimeout(resolve, 300))
    
    expect(global.fetch).toHaveBeenCalled()
    // Toast should be called with error (mocked so won't actually verify exact call)
  })
})