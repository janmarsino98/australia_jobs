import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import SignupPage from '../SignupPage'

// Mock dependencies
jest.mock('../../hooks/useZodForm')
jest.mock('../../stores/useAuthStore')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock components
jest.mock('../../components/molecules/EnhancedFormInput', () => {
  const MockEnhancedFormInput = React.forwardRef(({ label, error, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {error && <span role="alert">{error}</span>}
    </div>
  ))
  MockEnhancedFormInput.displayName = 'EnhancedFormInput'
  return MockEnhancedFormInput
})

jest.mock('../../components/molecules/SocialLoginButtons', () => {
  return function SocialLoginButtons() {
    return (
      <div data-testid="social-login-buttons">
        <button>Google Sign Up</button>
        <button>LinkedIn Sign Up</button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loading-spinner">Loading...</div>
  ),
}))

// Mock image import
jest.mock('../../imgs/logo.png', () => 'mock-logo.png')

const mockNavigate = jest.fn()
const mockRegisterUser = jest.fn()
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn()
const mockSetError = jest.fn()

const mockUseZodForm = require('../../hooks/useZodForm')
const mockUseAuthStore = require('../../stores/useAuthStore')
const mockReactRouter = require('react-router-dom')

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockReactRouter.useNavigate.mockReturnValue(mockNavigate)
    
    mockUseAuthStore.default.mockReturnValue({
      register: mockRegisterUser,
    })
    
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: false },
      setError: mockSetError,
    })
    
    mockRegister.mockReturnValue({
      name: 'test-field',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })
    
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault()
      fn({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'job_seeker',
        acceptTerms: true,
      })
    })
  })

  const renderSignupPage = () => {
    return render(
      <BrowserRouter>
        <SignupPage />
      </BrowserRouter>
    )
  }

  test('renders signup form with all elements', () => {
    renderSignupPage()
    
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
    expect(screen.getByText('Join thousands of job seekers and employers finding success')).toBeInTheDocument()
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  test('displays logo and branding', () => {
    renderSignupPage()
    
    const logo = screen.getByAltText('Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'mock-logo.png')
  })

  test('handles form submission successfully', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockResolvedValueOnce(undefined)
    
    renderSignupPage()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(mockHandleSubmit).toHaveBeenCalled()
    expect(mockRegisterUser).toHaveBeenCalledWith(
      'John Doe',
      'john@example.com',
      'password123',
      'job_seeker'
    )
    expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
      state: {
        message: 'Account created successfully! Please check your email to verify your account.',
        email: 'john@example.com'
      }
    })
  })

  test('handles form submission error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email already exists'
    mockRegisterUser.mockRejectedValueOnce(new Error(errorMessage))
    
    renderSignupPage()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(mockSetError).toHaveBeenCalledWith('root', {
      message: errorMessage
    })
  })

  test('handles form submission error without message', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockRejectedValueOnce({})
    
    renderSignupPage()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(mockSetError).toHaveBeenCalledWith('root', {
      message: 'Registration failed. Please try again.'
    })
  })

  test('displays validation errors', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          name: { message: 'Name is required' },
          email: { message: 'Valid email is required' },
          password: { message: 'Password must be at least 8 characters' },
          confirmPassword: { message: 'Passwords do not match' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderSignupPage()
    
    expect(screen.getByText('Name is required')).toBeInTheDocument()
    expect(screen.getByText('Valid email is required')).toBeInTheDocument()
    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
  })

  test('displays root error message', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          root: { message: 'Registration failed. Please try again.' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderSignupPage()
    
    expect(screen.getByText('Registration failed. Please try again.')).toBeInTheDocument()
  })

  test('shows loading state during submission', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: true },
      setError: mockSetError,
    })
    
    renderSignupPage()
    
    expect(screen.getByText(/creating account/i)).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    const submitButton = screen.getByRole('button', { name: /creating account/i })
    expect(submitButton).toBeDisabled()
  })

  test('renders social login buttons', () => {
    renderSignupPage()
    
    expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument()
    expect(screen.getByText('Google Sign Up')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn Sign Up')).toBeInTheDocument()
  })

  test('has login link', () => {
    renderSignupPage()
    
    const loginLink = screen.getByRole('link', { name: 'Sign in' })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  test('role selection functionality', () => {
    renderSignupPage()
    
    // Check if role selection is handled by the form registration
    expect(mockRegister).toHaveBeenCalledWith('role')
  })

  test('terms and conditions acceptance', () => {
    renderSignupPage()
    
    // Check if terms acceptance checkbox is registered
    expect(mockRegister).toHaveBeenCalledWith('acceptTerms')
    
    // Look for terms and conditions related text
    const termsText = screen.getByText(/terms and conditions/i)
    expect(termsText).toBeInTheDocument()
  })

  test('password confirmation validation', () => {
    renderSignupPage()
    
    // Verify that both password fields are registered
    expect(mockRegister).toHaveBeenCalledWith('password')
    expect(mockRegister).toHaveBeenCalledWith('confirmPassword')
  })

  test('form fields have proper accessibility attributes', () => {
    renderSignupPage()
    
    const nameField = screen.getByLabelText('Full Name')
    const emailField = screen.getByLabelText('Email Address')
    const passwordField = screen.getByLabelText('Password')
    const confirmPasswordField = screen.getByLabelText('Confirm Password')
    
    expect(nameField).toBeInTheDocument()
    expect(emailField).toBeInTheDocument()
    expect(passwordField).toBeInTheDocument()
    expect(confirmPasswordField).toBeInTheDocument()
  })

  test('form has proper structure and styling', () => {
    renderSignupPage()
    
    // Check for main container
    const mainContainer = screen.getByText('Create Your Account').closest('div')
    expect(mainContainer).toHaveClass('backdrop-blur-sm', 'bg-white/80', 'shadow-2xl')
    
    // Check for form presence
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    expect(form).toBeInTheDocument()
  })

  test('handles navigation to email verification after successful signup', async () => {
    const user = userEvent.setup()
    mockRegisterUser.mockResolvedValueOnce(undefined)
    
    renderSignupPage()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: {
          message: 'Account created successfully! Please check your email to verify your account.',
          email: 'john@example.com'
        }
      })
    })
  })

  test('form submission prevents default behavior', async () => {
    const user = userEvent.setup()
    const mockPreventDefault = jest.fn()
    
    // Mock the form submission event
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      mockPreventDefault()
      fn({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        role: 'job_seeker',
        acceptTerms: true,
      })
    })
    
    renderSignupPage()
    
    const submitButton = screen.getByRole('button', { name: /create account/i })
    await user.click(submitButton)
    
    expect(mockPreventDefault).toHaveBeenCalled()
  })

  test('displays help text for form fields', () => {
    renderSignupPage()
    
    // Check that help text is displayed for name field
    expect(screen.getByText('Enter your full name as it appears on official documents')).toBeInTheDocument()
  })

  test('handles different user roles', () => {
    // Test that the form supports different roles (job_seeker, employer)
    renderSignupPage()
    
    // The register function should be called with 'role'
    expect(mockRegister).toHaveBeenCalledWith('role')
  })

  test('background and styling elements are present', () => {
    renderSignupPage()
    
    // Check for gradient background structure
    const container = screen.getByText('Create Your Account').closest('.min-h-screen')
    expect(container).toBeInTheDocument()
  })
})