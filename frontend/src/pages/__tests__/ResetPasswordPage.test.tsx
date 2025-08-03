import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import ResetPasswordPage from '../ResetPasswordPage'

// Mock dependencies
jest.mock('../../hooks/useZodForm')
jest.mock('../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`),
}))
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
  const MockEnhancedFormInput = React.forwardRef(({ label, error, helpText, ...props }: any, ref: any) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...props} />
      {helpText && <div className="help-text">{helpText}</div>}
      {error && <span role="alert">{error}</span>}
    </div>
  ))
  MockEnhancedFormInput.displayName = 'EnhancedFormInput'
  return MockEnhancedFormInput
})

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className?: string }) => (
    <div className={className} data-testid="loading-spinner">Loading...</div>
  ),
}))

// Mock image import
jest.mock('../../imgs/logo.png', () => 'mock-logo.png')

// Mock fetch
global.fetch = jest.fn()

const mockNavigate = jest.fn()
const mockRegister = jest.fn()
const mockHandleSubmit = jest.fn()
const mockSetError = jest.fn()

const mockUseZodForm = require('../../hooks/useZodForm')
const mockReactRouter = require('react-router-dom')
const mockConfig = require('../../config')

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockReactRouter.useNavigate.mockReturnValue(mockNavigate)
    mockConfig.buildApiUrl.mockImplementation((path: string) => `http://localhost:5000${path}`)
    
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
    
    // Mock fetch to resolve successfully by default
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  const renderResetPasswordPage = () => {
    return render(
      <BrowserRouter>
        <ResetPasswordPage />
      </BrowserRouter>
    )
  }

  test('renders reset password request form initially', () => {
    renderResetPasswordPage()
    
    expect(screen.getByText('Reset Password')).toBeInTheDocument()
    expect(screen.getByText('Enter your email to receive a password reset code')).toBeInTheDocument()
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send Reset Code' })).toBeInTheDocument()
  })

  test('displays logo and branding', () => {
    renderResetPasswordPage()
    
    const logo = screen.getByAltText('Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'mock-logo.png')
  })

  test('handles email submission successfully', async () => {
    const user = userEvent.setup()
    
    // Mock first form (request form)
    mockHandleSubmit.mockImplementation((fn) => (e) => {
      e.preventDefault()
      fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(submitButton)
    
    expect(mockHandleSubmit).toHaveBeenCalled()
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/auth/reset-password/request',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    )
  })

  test('handles email submission error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Email not found'
    
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    })
    
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('root', {
        message: errorMessage
      })
    })
  })

  test('progresses to reset form after successful email submission', async () => {
    const user = userEvent.setup()
    
    // Mock successful email submission
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Reset Code')).toBeInTheDocument()
      expect(screen.getByText('Check your email for the reset code')).toBeInTheDocument()
      expect(screen.getByLabelText('Reset Code')).toBeInTheDocument()
      expect(screen.getByLabelText('New Password')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
    })
  })

  test('handles password reset submission successfully', async () => {
    const user = userEvent.setup()
    
    // Mock reset form submission
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ code: '123456', newPassword: 'newPassword123' })
    })
    
    // First, trigger email submission to get to reset form
    renderResetPasswordPage()
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Reset Code')).toBeInTheDocument()
    })
    
    // Now test reset form submission
    const resetButton = screen.getByRole('button', { name: 'Reset Password' })
    await user.click(resetButton)
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/auth/reset-password/confirm',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            email: 'test@example.com',
            code: '123456',
            newPassword: 'newPassword123',
          }),
        })
      )
      
      expect(mockNavigate).toHaveBeenCalledWith('/login', {
        state: { message: 'Password reset successful. Please login with your new password.' }
      })
    })
  })

  test('handles password reset submission error', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Invalid reset code'
    
    // Mock error response for reset form
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // First call (email)
      .mockResolvedValueOnce({ // Second call (reset)
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      })
    
    // Mock both forms
    let callCount = 0
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      if (callCount === 0) {
        callCount++
        await fn({ email: 'test@example.com' })
      } else {
        await fn({ code: '123456', newPassword: 'newPassword123' })
      }
    })
    
    renderResetPasswordPage()
    
    // First submit email
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Reset Code')).toBeInTheDocument()
    })
    
    // Then submit reset form
    const resetButton = screen.getByRole('button', { name: 'Reset Password' })
    await user.click(resetButton)
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('root', {
        message: errorMessage
      })
    })
  })

  test('displays validation errors for email form', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          email: { message: 'Valid email is required' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderResetPasswordPage()
    
    expect(screen.getByText('Valid email is required')).toBeInTheDocument()
  })

  test('displays validation errors for reset form', async () => {
    const user = userEvent.setup()
    
    // First get to reset form
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Reset Code')).toBeInTheDocument()
    })
    
    // Mock validation errors for reset form
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          code: { message: 'Reset code is required' },
          newPassword: { message: 'Password must be at least 8 characters' },
          confirmPassword: { message: 'Passwords do not match' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    // Re-render to show validation errors
    renderResetPasswordPage()
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Reset code is required')).toBeInTheDocument()
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  test('shows loading state during email submission', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: true },
      setError: mockSetError,
    })
    
    renderResetPasswordPage()
    
    expect(screen.getByText('Sending Code...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    
    const submitButton = screen.getByRole('button', { name: /sending code/i })
    expect(submitButton).toBeDisabled()
  })

  test('shows loading state during password reset', async () => {
    const user = userEvent.setup()
    
    // First get to reset form
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter Reset Code')).toBeInTheDocument()
    })
    
    // Mock loading state for reset form
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { errors: {}, isSubmitting: true },
      setError: mockSetError,
    })
    
    renderResetPasswordPage()
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Resetting Password...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  test('displays root error messages', () => {
    mockUseZodForm.useZodForm.mockReturnValue({
      register: mockRegister,
      handleSubmit: mockHandleSubmit,
      formState: { 
        errors: { 
          root: { message: 'Failed to send reset code. Please try again.' }
        }, 
        isSubmitting: false 
      },
      setError: mockSetError,
    })
    
    renderResetPasswordPage()
    
    expect(screen.getByText('Failed to send reset code. Please try again.')).toBeInTheDocument()
  })

  test('has login link', () => {
    renderResetPasswordPage()
    
    const loginLink = screen.getByRole('link', { name: 'Sign in' })
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  test('displays help text for form fields', () => {
    renderResetPasswordPage()
    
    expect(screen.getByText('Enter the email address associated with your account')).toBeInTheDocument()
  })

  test('handles network errors gracefully', async () => {
    const user = userEvent.setup()
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    
    const submitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('root', {
        message: 'Network error'
      })
    })
  })

  test('form fields have proper accessibility attributes', () => {
    renderResetPasswordPage()
    
    const emailField = screen.getByLabelText('Email Address')
    expect(emailField).toBeInTheDocument()
    expect(emailField).toHaveAttribute('type', 'email')
  })

  test('reset form fields have proper accessibility attributes', async () => {
    const user = userEvent.setup()
    
    // Get to reset form
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      const codeField = screen.getByLabelText('Reset Code')
      const passwordField = screen.getByLabelText('New Password')
      const confirmPasswordField = screen.getByLabelText('Confirm Password')
      
      expect(codeField).toBeInTheDocument()
      expect(passwordField).toHaveAttribute('type', 'password')
      expect(confirmPasswordField).toHaveAttribute('type', 'password')
    })
  })

  test('displays appropriate help text for reset form fields', async () => {
    const user = userEvent.setup()
    
    // Get to reset form
    mockHandleSubmit.mockImplementation((fn) => async (e) => {
      e.preventDefault()
      await fn({ email: 'test@example.com' })
    })
    
    renderResetPasswordPage()
    const emailSubmitButton = screen.getByRole('button', { name: 'Send Reset Code' })
    await user.click(emailSubmitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Enter the 6-digit code sent to your email')).toBeInTheDocument()
      expect(screen.getByText('Create a strong password for your account')).toBeInTheDocument()
      expect(screen.getByText('Re-enter your new password to confirm')).toBeInTheDocument()
    })
  })
})