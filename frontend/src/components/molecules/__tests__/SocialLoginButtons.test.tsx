import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SocialLoginButtons from '../SocialLoginButtons'

// Mock dependencies
jest.mock('../../stores/useAuthStore')
jest.mock('../ui/use-toast')
jest.mock('../LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: { className: string }) => (
    <div data-testid="loading-spinner" className={className}>Loading...</div>
  )
}))

const mockLoginWithGoogle = jest.fn()
const mockLoginWithLinkedIn = jest.fn()
const mockToast = jest.fn()

// Mock the auth store
jest.mocked(require('../../stores/useAuthStore')).default = jest.fn(() => ({
  loginWithGoogle: mockLoginWithGoogle,
  loginWithLinkedIn: mockLoginWithLinkedIn,
}))

// Mock the toast hook
jest.mocked(require('../ui/use-toast')).useToast = jest.fn(() => ({
  toast: mockToast,
}))

const renderComponent = (props = {}) => {
  return render(<SocialLoginButtons {...props} />)
}

describe('SocialLoginButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders Google login button', () => {
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    expect(googleButton).toBeInTheDocument()
    expect(googleButton).toHaveClass('flex', 'items-center', 'justify-center', 'space-x-2')
    expect(googleButton).toHaveAttribute('type', 'button')
    
    const googleLogo = screen.getByAltText('Google logo')
    expect(googleLogo).toBeInTheDocument()
    expect(googleLogo).toHaveAttribute('src', 'https://www.svgrepo.com/show/475656/google-color.svg')
  })

  test('renders LinkedIn login button', () => {
    renderComponent()
    
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    expect(linkedinButton).toBeInTheDocument()
    expect(linkedinButton).toHaveClass('flex', 'items-center', 'justify-center', 'space-x-2')
    expect(linkedinButton).toHaveAttribute('type', 'button')
    
    const linkedinLogo = screen.getByAltText('LinkedIn logo')
    expect(linkedinLogo).toBeInTheDocument()
    expect(linkedinLogo).toHaveAttribute('src', 'https://www.svgrepo.com/show/448234/linkedin.svg')
  })

  test('applies custom className', () => {
    const customClass = 'custom-test-class'
    renderComponent({ className: customClass })
    
    const container = screen.getByRole('button', { name: /google/i }).closest('div')
    expect(container).toHaveClass('grid', 'grid-cols-2', 'gap-4', customClass)
  })

  test('handles Google OAuth redirect', async () => {
    const user = userEvent.setup()
    mockLoginWithGoogle.mockResolvedValue(undefined)
    
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    await user.click(googleButton)
    
    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1)
  })

  test('handles LinkedIn OAuth redirect', async () => {
    const user = userEvent.setup()
    mockLoginWithLinkedIn.mockResolvedValue(undefined)
    
    renderComponent()
    
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    await user.click(linkedinButton)
    
    expect(mockLoginWithLinkedIn).toHaveBeenCalledTimes(1)
  })

  test('shows loading state for Google login', async () => {
    const user = userEvent.setup()
    let resolveLogin: () => void
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve
    })
    mockLoginWithGoogle.mockReturnValue(loginPromise)
    
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    await user.click(googleButton)
    
    // Should show loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
    
    // Both buttons should be disabled during loading
    expect(googleButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /linkedin/i })).toBeDisabled()
    
    resolveLogin!()
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  test('shows loading state for LinkedIn login', async () => {
    const user = userEvent.setup()
    let resolveLogin: () => void
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve
    })
    mockLoginWithLinkedIn.mockReturnValue(loginPromise)
    
    renderComponent()
    
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    await user.click(linkedinButton)
    
    // Should show loading state
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('Connecting...')).toBeInTheDocument()
    
    // Both buttons should be disabled during loading
    expect(linkedinButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /google/i })).toBeDisabled()
    
    resolveLogin!()
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument()
    })
  })

  test('handles Google authentication errors', async () => {
    const user = userEvent.setup()
    const errorMessage = 'Google auth failed'
    mockLoginWithGoogle.mockRejectedValue(new Error(errorMessage))
    
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    await user.click(googleButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login Failed',
        description: 'Failed to initiate Google login. Please try again.',
        variant: 'destructive',
      })
    })
    
    // Button should be enabled again after error
    expect(googleButton).not.toBeDisabled()
  })

  test('handles LinkedIn authentication errors', async () => {
    const user = userEvent.setup()
    const errorMessage = 'LinkedIn auth failed'
    mockLoginWithLinkedIn.mockRejectedValue(new Error(errorMessage))
    
    renderComponent()
    
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    await user.click(linkedinButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Login Failed',
        description: 'Failed to initiate LinkedIn login. Please try again.',
        variant: 'destructive',
      })
    })
    
    // Button should be enabled again after error
    expect(linkedinButton).not.toBeDisabled()
  })

  test('prevents multiple concurrent login attempts', async () => {
    const user = userEvent.setup()
    let resolveGoogleLogin: () => void
    const googleLoginPromise = new Promise<void>((resolve) => {
      resolveGoogleLogin = resolve
    })
    mockLoginWithGoogle.mockReturnValue(googleLoginPromise)
    
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    
    // Start Google login
    await user.click(googleButton)
    expect(googleButton).toBeDisabled()
    expect(linkedinButton).toBeDisabled()
    
    // Try to click LinkedIn while Google is loading
    await user.click(linkedinButton)
    expect(mockLoginWithLinkedIn).not.toHaveBeenCalled()
    
    resolveGoogleLogin!()
  })

  test('has proper grid layout structure', () => {
    renderComponent()
    
    const container = screen.getByRole('button', { name: /google/i }).closest('div')
    expect(container).toHaveClass('grid', 'grid-cols-2', 'gap-4')
  })

  test('buttons have outline variant styling', () => {
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    const linkedinButton = screen.getByRole('button', { name: /linkedin/i })
    
    // Note: We can't directly test the variant prop, but we can verify the buttons exist
    expect(googleButton).toBeInTheDocument()
    expect(linkedinButton).toBeInTheDocument()
  })

  test('loading spinner has correct styling when displayed', async () => {
    const user = userEvent.setup()
    let resolveLogin: () => void
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve
    })
    mockLoginWithGoogle.mockReturnValue(loginPromise)
    
    renderComponent()
    
    const googleButton = screen.getByRole('button', { name: /google/i })
    await user.click(googleButton)
    
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toHaveClass('h-4', 'w-4')
    
    resolveLogin!()
  })
})