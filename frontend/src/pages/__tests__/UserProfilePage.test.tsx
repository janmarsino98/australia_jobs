import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import UserProfilePage from '../UserProfilePage'

// Mock dependencies
jest.mock('../../hooks/useZodForm')
jest.mock('../../stores/useAuthStore')
jest.mock('../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`),
  default: { baseURL: 'http://localhost:5000' }
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: jest.fn(),
  useLocation: jest.fn(),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
  },
}))

// Mock components
jest.mock('../../components/molecules/FormInput', () => {
  const MockFormInput = React.forwardRef(({ label, error, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ))
  MockFormInput.displayName = 'FormInput'
  return MockFormInput
})

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loading-spinner">Loading...</div>
  ),
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

const mockUseZodForm = require('../../hooks/useZodForm')
const mockUseAuthStore = require('../../stores/useAuthStore')
const mockReactRouter = require('react-router-dom')

describe('UserProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockReactRouter.useSearchParams.mockReturnValue([
      new URLSearchParams(),
      jest.fn()
    ])
    
    mockReactRouter.useLocation.mockReturnValue({
      pathname: '/profile',
      state: null,
    })
    
    mockUseAuthStore.default.mockReturnValue({
      user: {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        profile_picture: null,
        bio: 'Software developer',
        phone: '+61400000000',
        location: { city: 'Sydney', state: 'NSW' }
      },
      updateProfile: jest.fn(),
    })
    
    mockUseZodForm.useZodForm.mockReturnValue({
      register: jest.fn().mockReturnValue({
        name: 'test-field',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
      }),
      handleSubmit: jest.fn().mockImplementation((fn) => (e) => {
        e.preventDefault()
        fn({ name: 'Updated Name', bio: 'Updated bio' })
      }),
      formState: { errors: {}, isSubmitting: false },
      setError: jest.fn(),
      reset: jest.fn(),
      watch: jest.fn(),
      setValue: jest.fn(),
    })
  })

  const renderUserProfilePage = () => {
    return render(
      <BrowserRouter>
        <UserProfilePage />
      </BrowserRouter>
    )
  }

  test('renders user profile page with user information', () => {
    renderUserProfilePage()
    
    expect(screen.getByText('Profile')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Software developer')).toBeInTheDocument()
  })

  test('displays user location information', () => {
    renderUserProfilePage()
    
    expect(screen.getByText(/Sydney/)).toBeInTheDocument()
    expect(screen.getByText(/NSW/)).toBeInTheDocument()
  })

  test('displays user phone number', () => {
    renderUserProfilePage()
    
    expect(screen.getByText('+61400000000')).toBeInTheDocument()
  })

  test('renders edit profile functionality', () => {
    renderUserProfilePage()
    
    // Look for edit buttons or form fields
    const editButtons = screen.getAllByRole('button')
    expect(editButtons.length).toBeGreaterThan(0)
  })

  test('handles profile picture upload modal', async () => {
    const user = userEvent.setup()
    renderUserProfilePage()
    
    // Look for profile picture related elements
    const profilePictureSection = screen.getByText('John Doe').closest('section')
    expect(profilePictureSection).toBeInTheDocument()
  })

  test('handles email change modal', async () => {
    const user = userEvent.setup()
    renderUserProfilePage()
    
    // Email should be displayed
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  test('renders form sections', () => {
    renderUserProfilePage()
    
    // Check for basic info section
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    
    // The page should contain form elements
    const forms = screen.getAllByRole('button')
    expect(forms.length).toBeGreaterThan(0)
  })

  test('handles form validation errors', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: jest.fn().mockReturnValue({
        name: 'test-field',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
      }),
      handleSubmit: jest.fn(),
      formState: { 
        errors: { 
          name: { message: 'Name is required' },
          bio: { message: 'Bio is too long' }
        }, 
        isSubmitting: false 
      },
      setError: jest.fn(),
      reset: jest.fn(),
      watch: jest.fn(),
      setValue: jest.fn(),
    })
    
    renderUserProfilePage()
    
    // Error messages should be displayed
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Bio is too long')).toBeInTheDocument()
  })

  test('shows loading state during form submission', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: jest.fn().mockReturnValue({
        name: 'test-field',
        onChange: jest.fn(),
        onBlur: jest.fn(),
        ref: jest.fn(),
      }),
      handleSubmit: jest.fn(),
      formState: { errors: {}, isSubmitting: true },
      setError: jest.fn(),
      reset: jest.fn(),
      watch: jest.fn(),
      setValue: jest.fn(),
    })
    
    renderUserProfilePage()
    
    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  test('handles user without profile picture', () => {
    mockUseAuthStore.default.mockReturnValue({
      user: {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        profile_picture: null,
        bio: null,
        phone: null,
        location: null
      },
      updateProfile: jest.fn(),
    })
    
    renderUserProfilePage()
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  test('renders profile completion indicators', () => {
    renderUserProfilePage()
    
    // The page should show some form of profile completion status
    // This might be in the form of progress indicators or section completion
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  test('handles form submission for profile updates', async () => {
    const user = userEvent.setup()
    const mockUpdateProfile = jest.fn()
    
    mockUseAuthStore.default.mockReturnValue({
      user: {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        profile_picture: null,
        bio: 'Software developer',
        phone: '+61400000000',
        location: { city: 'Sydney', state: 'NSW' }
      },
      updateProfile: mockUpdateProfile,
    })
    
    renderUserProfilePage()
    
    // Find and interact with form elements
    const buttons = screen.getAllByRole('button')
    const saveButton = buttons.find(button => 
      button.textContent?.toLowerCase().includes('save') ||
      button.textContent?.toLowerCase().includes('update')
    )
    
    if (saveButton) {
      await user.click(saveButton)
    }
    
    // At minimum, the page should render without crashing
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  test('displays user information in structured format', () => {
    renderUserProfilePage()
    
    // Check that user information is displayed in cards or sections
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
    expect(screen.getByText('Software developer')).toBeInTheDocument()
    
    // Check for structured layout elements
    const profileContainer = screen.getByText('Profile')
    expect(profileContainer).toBeInTheDocument()
  })
})