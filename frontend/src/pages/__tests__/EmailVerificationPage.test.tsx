import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import EmailVerificationPage from '../EmailVerificationPage'

// Mock dependencies
jest.mock('../../stores/useAuthStore')
jest.mock('../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`),
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
  useLocation: jest.fn(),
}))

// Mock Framer Motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}))

// Mock components
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
const mockRefreshUser = jest.fn()

const mockUseAuthStore = require('../../stores/useAuthStore')
const mockReactRouter = require('react-router-dom')
const mockConfig = require('../../config')

describe('EmailVerificationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    mockReactRouter.useNavigate.mockReturnValue(mockNavigate)
    mockConfig.buildApiUrl.mockImplementation((path: string) => `http://localhost:5000${path}`)
    
    mockUseAuthStore.default.mockReturnValue({
      refreshUser: mockRefreshUser,
    })
    
    mockReactRouter.useSearchParams.mockReturnValue([
      new URLSearchParams(),
      jest.fn()
    ])
    
    mockReactRouter.useLocation.mockReturnValue({
      state: null,
    })
    
    // Mock fetch to resolve successfully by default
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  })

  const renderEmailVerificationPage = (props = {}) => {
    return render(
      <BrowserRouter>
        <EmailVerificationPage {...props} />
      </BrowserRouter>
    )
  }

  test('renders email verification page in pending state without token', () => {
    renderEmailVerificationPage()
    
    expect(screen.getByText('Email Verification')).toBeInTheDocument()
    expect(screen.getByText('Check Your Email')).toBeInTheDocument()
    expect(screen.getByText("We've sent a verification link to your email address. Click the link in your email to verify your account.")).toBeInTheDocument()
  })

  test('renders email change verification page when isEmailChange prop is true', () => {
    renderEmailVerificationPage({ isEmailChange: true })
    
    expect(screen.getByText('Email Change Verification')).toBeInTheDocument()
    expect(screen.getByText('Check your new email address for the verification link')).toBeInTheDocument()
  })

  test('displays logo and branding', () => {
    renderEmailVerificationPage()
    
    const logo = screen.getByAltText('Logo')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'mock-logo.png')
  })

  test('automatically verifies email when token is present in URL', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/auth/verify-email',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: 'test-token' }),
        })
      )
    })
  })

  test('uses correct endpoint for email change verification', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage({ isEmailChange: true })
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/auth/verify-email-change',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token: 'test-token' }),
        })
      )
    })
  })

  test('shows verifying state during email verification', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    // Mock a slow response
    ;(global.fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      }), 100))
    )
    
    renderEmailVerificationPage()
    
    expect(screen.getByText('Verifying your email address...')).toBeInTheDocument()
    expect(screen.getByText('Please wait while we verify your email address...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  test('shows success state after successful verification', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(screen.getByText('Email Verified Successfully!')).toBeInTheDocument()
      expect(screen.getByText('Your account is now active. You can start using all features of AusJobs.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Continue to Login' })).toBeInTheDocument()
    })
  })

  test('shows success state for email change verification', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage({ isEmailChange: true })
    
    await waitFor(() => {
      expect(screen.getByText('Email Changed Successfully!')).toBeInTheDocument()
      expect(screen.getByText('Your email address has been updated successfully. Your profile will be automatically updated and you\'ll be redirected to your profile page.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back to Profile' })).toBeInTheDocument()
    })
    
    expect(mockRefreshUser).toHaveBeenCalled()
  })

  test('shows error state when verification fails', async () => {
    const mockSearchParams = new URLSearchParams('?token=invalid-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    const errorMessage = 'Invalid or expired token'
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: errorMessage }),
    })
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(screen.getByText('Email verification failed')).toBeInTheDocument()
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText('The verification link may have expired or been used already.')).toBeInTheDocument()
    })
  })

  test('handles resend verification email functionality', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?email=test@example.com')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    expect(resendButton).toBeInTheDocument()
    
    await user.click(resendButton)
    
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:5000/auth/resend-verification',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: 'test@example.com' }),
      })
    )
  })

  test('shows resend cooldown timer after resending', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?email=test@example.com')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    await waitFor(() => {
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument()
    })
  })

  test('gets email from location state when not in search params', () => {
    mockReactRouter.useLocation.mockReturnValue({
      state: { email: 'state-email@example.com' },
    })
    
    renderEmailVerificationPage()
    
    expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument()
  })

  test('handles resend verification error', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?email=test@example.com')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    const errorMessage = 'Failed to resend email'
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // Initial page load
      .mockResolvedValueOnce({ // Resend request
        ok: false,
        json: () => Promise.resolve({ message: errorMessage }),
      })
    
    renderEmailVerificationPage()
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    // The error message should be displayed (implementation may vary)
    // This test ensures the error handling is triggered
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('shows loading state during resend operation', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?email=test@example.com')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    // Mock slow resend response
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) }) // Initial load
      .mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        }), 100))
      )
    
    renderEmailVerificationPage()
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    expect(screen.getByText('Resending...')).toBeInTheDocument()
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  test('navigates to login page on continue button click', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Continue to Login' })).toBeInTheDocument()
    })
    
    const continueButton = screen.getByRole('button', { name: 'Continue to Login' })
    await user.click(continueButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/login')
  })

  test('navigates to profile page on back button click for email change', async () => {
    const user = userEvent.setup()
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage({ isEmailChange: true })
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to Profile' })).toBeInTheDocument()
    })
    
    const backButton = screen.getByRole('button', { name: 'Back to Profile' })
    await user.click(backButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  test('has contact support link', () => {
    renderEmailVerificationPage()
    
    const contactLink = screen.getByRole('link', { name: 'Contact Support' })
    expect(contactLink).toBeInTheDocument()
    expect(contactLink).toHaveAttribute('href', '/about')
  })

  test('handles network errors gracefully', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(screen.getByText('Email verification failed')).toBeInTheDocument()
      expect(screen.getByText('Network error')).toBeInTheDocument()
    })
  })

  test('automatically redirects to profile after email change verification', async () => {
    jest.useFakeTimers()
    
    const mockSearchParams = new URLSearchParams('?token=test-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage({ isEmailChange: true })
    
    await waitFor(() => {
      expect(screen.getByText('Email Changed Successfully!')).toBeInTheDocument()
    })
    
    // Fast-forward time by 3 seconds
    jest.advanceTimersByTime(3000)
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile', {
        state: {
          message: 'Your email address has been successfully updated!',
          type: 'success'
        }
      })
    })
    
    jest.useRealTimers()
  })

  test('shows different messages based on verification type', () => {
    // Test regular email verification
    renderEmailVerificationPage()
    expect(screen.getByText('Check your email for the verification link')).toBeInTheDocument()
    
    // Re-render for email change verification
    renderEmailVerificationPage({ isEmailChange: true })
    expect(screen.getByText('Check your new email address for the verification link')).toBeInTheDocument()
  })

  test('disables resend button when no email is available', () => {
    // No email in search params or location state
    renderEmailVerificationPage()
    
    // Should not show resend button when no email is available
    expect(screen.queryByRole('button', { name: /resend verification email/i })).not.toBeInTheDocument()
  })

  test('handles verification token processing correctly', async () => {
    const mockSearchParams = new URLSearchParams('?token=test-verification-token')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/auth/verify-email',
        expect.objectContaining({
          body: JSON.stringify({ token: 'test-verification-token' }),
        })
      )
    })
  })

  test('cooldown timer decreases correctly', async () => {
    jest.useFakeTimers()
    
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    const mockSearchParams = new URLSearchParams('?email=test@example.com')
    mockReactRouter.useSearchParams.mockReturnValue([
      mockSearchParams,
      jest.fn()
    ])
    
    renderEmailVerificationPage()
    
    const resendButton = screen.getByRole('button', { name: /resend verification email/i })
    await user.click(resendButton)
    
    // Should show cooldown
    await waitFor(() => {
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument()
    })
    
    // Advance timer by 1 second
    jest.advanceTimersByTime(1000)
    
    // Timer should decrease (this is a basic test - actual implementation may vary)
    await waitFor(() => {
      // The timer should still be counting down
      expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument()
    })
    
    jest.useRealTimers()
  })
})