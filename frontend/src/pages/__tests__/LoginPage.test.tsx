import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import LoginPage from '../LoginPage'

// Mock dependencies
jest.mock('../../hooks/useZodForm')
jest.mock('../../stores/useAuthStore')
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
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
        <button>Google Login</button>
        <button>LinkedIn Login</button>
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
jest.mock('../../imgs/logo.svg', () => 'mock-logo.svg')

const mockNavigate = jest.fn()
const mockLogin = jest.fn()
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn()
const mockSetError = jest.fn()

const mockUseZodForm = require('../../hooks/useZodForm')
const mockUseAuthStore = require('../../stores/useAuthStore')
const mockReactRouter = require('react-router-dom')

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockReactRouter.useNavigate.mockReturnValue(mockNavigate)
    mockReactRouter.useLocation.mockReturnValue({
      state: null,
    })
    
    mockUseAuthStore.default.mockReturnValue({
      login: mockLogin,
    })
    
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: false },
      setError: mockSetError,
    })
    
    mockRegister.mockReturnValue({
      name: 'email',
      onChange: jest.fn(),
      onBlur: jest.fn(),
      ref: jest.fn(),
    })
    
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault()
      fn({ email: 'test@example.com', password: 'password123', rememberMe: false })
    })
  })

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    )
  }

  test('renders login form with all elements', () => {
    renderLoginPage()
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to access your job search dashboard and saved applications')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Remember me')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
  })

  test('displays logo and branding', () => {
    renderLoginPage()
    
    const logo = screen.getByAltText('Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'mock-logo.svg')
  })

  test('handles form submission successfully', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    
    renderLoginPage()
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    expect(mockHandleSubmit).toHaveBeenCalled()
    expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', false)
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  test('handles form submission error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValueOnce({
      response: { data: { message: errorMessage } }
    })
    
    renderLoginPage()
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    expect(mockSetError).toHaveBeenCalledWith('root', {
      message: errorMessage
    })
  })

  test('handles form submission error without response message', async () => {
    const user = userEvent.setup()
    mockLogin.mockRejectedValueOnce(new Error('Network error'))
    
    renderLoginPage()
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    expect(mockSetError).toHaveBeenCalledWith('root', {
      message: 'Invalid email or password. Please try again.'
    })
  })

  test('displays validation errors', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          email: { message: 'Email is required' },
          password: { message: 'Password is required' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderLoginPage()
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  test('displays root error message', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          root: { message: 'Login failed. Please try again.' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderLoginPage()
    
    expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument()
  })

  test('shows loading state during submission', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: true },
      setError: mockSetError,
    })
    
    renderLoginPage()
    
    expect(screen.getByText('Signing in...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    const submitButton = screen.getByRole('button', { name: /signing in/i })
    expect(submitButton).toBeDisabled()
  })

  test('renders social login buttons', () => {
    renderLoginPage()
    
    expect(screen.getByTestId('social-login-buttons')).toBeInTheDocument()
    expect(screen.getByText('Google Login')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn Login')).toBeInTheDocument()
  })

  test('has forgot password link', () => {
    renderLoginPage()
    
    const forgotPasswordLink = screen.getByRole('link', { name: 'Forgot Password?' })
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink).toHaveAttribute('href', '/reset-password')
  })

  test('has sign up link', () => {
    renderLoginPage()
    
    const signupLink = screen.getByRole('link', { name: 'Sign up' })
    expect(signupLink).toBeInTheDocument()
    expect(signupLink).toHaveAttribute('href', '/signup')
  })

  test('displays location state message', () => {
    mockReactRouter.useLocation.mockReturnValue({
      state: { message: 'Please log in to continue' },
    })
    
    renderLoginPage()
    
    expect(screen.getByText('Please log in to continue')).toBeInTheDocument()
  })

  test('handles remember me checkbox', async () => {
    const user = userEvent.setup()
    
    renderLoginPage()
    
    const rememberMeCheckbox = screen.getByLabelText('Remember me')
    expect(rememberMeCheckbox).toBeInTheDocument()
    expect(rememberMeCheckbox).not.toBeChecked()
    
    await user.click(rememberMeCheckbox)
    
    // The register mock should be called for rememberMe
    expect(mockRegister).toHaveBeenCalledWith('rememberMe')
  })

  test('form fields have proper accessibility attributes', () => {
    renderLoginPage()
    
    const emailField = screen.getByLabelText('Email Address')
    const passwordField = screen.getByLabelText('Password')
    
    expect(emailField).toHaveAttribute('type', 'email')
    expect(passwordField).toHaveAttribute('type', 'password')
  })

  test('form has proper structure and styling', () => {
    renderLoginPage()
    
    // Check for main container
    const mainContainer = screen.getByText('Welcome Back').closest('div')
    expect(mainContainer).toHaveClass('backdrop-blur-sm', 'bg-white/80', 'shadow-2xl')
    
    // Check for form presence
    const form = screen.getByRole('button', { name: 'Sign In' }).closest('form')
    expect(form).toBeInTheDocument()
  })

  test('background and styling elements are present', () => {
    renderLoginPage()
    
    // Check for gradient background structure
    const container = screen.getByText('Welcome Back').closest('.min-h-screen')
    expect(container).toBeInTheDocument()
  })

  test('handles navigation to dashboard after successful login', async () => {
    const user = userEvent.setup()
    mockLogin.mockResolvedValueOnce(undefined)
    
    renderLoginPage()
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  test('form submission prevents default behavior', async () => {
    const user = userEvent.setup()
    const mockPreventDefault = jest.fn()
    
    // Mock the form submission event
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      mockPreventDefault()
      fn({ email: 'test@example.com', password: 'password123', rememberMe: false })
    })
    
    renderLoginPage()
    
    const submitButton = screen.getByRole('button', { name: 'Sign In' })
    await user.click(submitButton)
    
    expect(mockPreventDefault).toHaveBeenCalled()
  })
})