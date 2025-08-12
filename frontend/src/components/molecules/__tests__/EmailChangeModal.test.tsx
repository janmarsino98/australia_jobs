import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailChangeModal from '../EmailChangeModal';
import { buildApiUrl } from '../../../config';

// Mock dependencies
jest.mock('../../../config', () => ({
  buildApiUrl: jest.fn((path: string) => `http://localhost:5000${path}`)
}));

jest.mock('../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock UI components
jest.mock('../ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="modal" onClick={onOpenChange}>{children}</div> : null,
  DialogContent: ({ children, className }: any) => 
    <div className={className} data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>
}));

jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, type, variant, className, ...props }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`${className} ${variant}`}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../ui/input', () => ({
  Input: (props: any) => <input {...props} data-testid={`input-${props.placeholder?.toLowerCase().replace(/\s+/g, '-') || 'input'}`} />
}));

jest.mock('../ui/alert', () => ({
  Alert: ({ children, variant, className }: any) => 
    <div className={className} data-testid="alert" data-variant={variant}>{children}</div>,
  AlertDescription: ({ children }: any) => 
    <div data-testid="alert-description">{children}</div>
}));

jest.mock('./LoadingSpinner', () => ({
  LoadingSpinner: ({ className }: any) => 
    <div className={className} data-testid="loading-spinner" />
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Mail: () => <div data-testid="mail-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />
}));

// Mock global fetch
global.fetch = jest.fn();

const mockToast = jest.fn();
const mockBuildApiUrl = buildApiUrl as jest.MockedFunction<typeof buildApiUrl>;

const renderComponent = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    currentEmail: 'current@example.com',
    onEmailChangeRequested: jest.fn(),
    ...props
  };
  return render(<EmailChangeModal {...defaultProps} />);
};

describe('EmailChangeModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    mockBuildApiUrl.mockImplementation((path: string) => `http://localhost:5000${path}`);
  });

  describe('Basic Rendering', () => {
    test('renders modal when isOpen is true', () => {
      renderComponent();
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByText('Change Email Address')).toBeInTheDocument();
      expect(screen.getByTestId('mail-icon')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      renderComponent({ isOpen: false });
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('renders input step initially', () => {
      renderComponent();
      
      expect(screen.getByText("Enter your new email address. You'll need to verify it before the change takes effect.")).toBeInTheDocument();
      expect(screen.getByText('Current Email')).toBeInTheDocument();
      expect(screen.getByText('New Email Address')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Email')).toBeInTheDocument();
    });

    test('displays current email as disabled', () => {
      renderComponent({ currentEmail: 'test@example.com' });
      
      const currentEmailInput = screen.getByDisplayValue('test@example.com');
      expect(currentEmailInput).toBeDisabled();
      expect(currentEmailInput).toHaveClass('bg-gray-50');
    });
  });

  describe('Form Validation', () => {
    test('shows error for invalid email format', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'invalid-email');
      await user.type(confirmEmailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
    });

    test('shows error when emails do not match', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'different@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email addresses do not match')).toBeInTheDocument();
      });
    });

    test('shows error when new email is same as current', async () => {
      const user = userEvent.setup();
      renderComponent({ currentEmail: 'current@example.com' });
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'current@example.com');
      await user.type(confirmEmailInput, 'current@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('New email address must be different from current email')).toBeInTheDocument();
      });
    });

    test('clears error when new input is entered', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      // Trigger error first
      await user.type(newEmailInput, 'invalid-email');
      await user.type(confirmEmailInput, 'invalid-email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
      });
      
      // Clear and enter valid email
      await user.clear(newEmailInput);
      await user.clear(confirmEmailInput);
      await user.type(newEmailInput, 'valid@example.com');
      await user.type(confirmEmailInput, 'valid@example.com');
      
      // Try submitting again (will fail due to no mock response, but error should be cleared)
      await user.click(submitButton);
      
      // The validation error should be cleared
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  describe('Email Change Process', () => {
    test('submits email change request successfully', async () => {
      const user = userEvent.setup();
      const onEmailChangeRequested = jest.fn();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          email_verification_pending: true
        })
      });
      
      renderComponent({ onEmailChangeRequested });
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/users/profile',
        expect.objectContaining({
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email: 'new@example.com' })
        })
      );
      
      await waitFor(() => {
        expect(onEmailChangeRequested).toHaveBeenCalled();
      });
    });

    test('shows loading state during submission', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ email_verification_pending: true })
          }), 100)
        )
      );
      
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Sending Verification...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
    });

    test('handles API error response', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Email already exists' })
      });
      
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email already exists')).toBeInTheDocument();
      });
    });

    test('handles network error', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });
  });

  describe('Verification Step', () => {
    test('transitions to verification step after successful submission', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          email_verification_pending: true
        })
      });
      
      renderComponent();
      
      // Submit the form
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Verification Email Sent')).toBeInTheDocument();
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
        expect(screen.getByText("We've sent a verification email to")).toBeInTheDocument();
        expect(screen.getByText('new@example.com')).toBeInTheDocument();
      });
    });

    test('shows verification step description', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          email_verification_pending: true
        })
      });
      
      renderComponent();
      
      // Submit to reach verification step
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('A verification email has been sent to your new email address.')).toBeInTheDocument();
        expect(screen.getByText('Click the verification link in the email to complete your email change.')).toBeInTheDocument();
        expect(screen.getByText('The verification link will expire in 24 hours.')).toBeInTheDocument();
      });
    });

    test('provides resend verification functionality', async () => {
      const user = userEvent.setup();
      
      // Mock initial successful submission
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ email_verification_pending: true })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({})
        });
      
      renderComponent();
      
      // Submit to reach verification step
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      let submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
      });
      
      // Click resend
      const resendButton = screen.getByText('Resend Verification Email');
      await user.click(resendButton);
      
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenLastCalledWith(
        'http://localhost:5000/users/profile',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ email: 'new@example.com' })
        })
      );
    });

    test('shows loading state during resend', async () => {
      const user = userEvent.setup();
      
      // Mock successful initial submission
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ email_verification_pending: true })
        })
        .mockImplementationOnce(() => 
          new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({})
            }), 100)
          )
        );
      
      renderComponent();
      
      // Get to verification step
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
      });
      
      // Click resend
      const resendButton = screen.getByText('Resend Verification Email');
      await user.click(resendButton);
      
      expect(screen.getByText('Resending...')).toBeInTheDocument();
      expect(resendButton).toBeDisabled();
    });

    test('handles resend error gracefully', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ email_verification_pending: true })
        })
        .mockRejectedValueOnce(new Error('Network error'));
      
      renderComponent();
      
      // Get to verification step
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
      });
      
      // Click resend (will fail)
      const resendButton = screen.getByText('Resend Verification Email');
      await user.click(resendButton);
      
      // Error should be handled via toast (mocked)
      await waitFor(() => {
        expect(screen.getByText('Resend Verification Email')).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    test('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderComponent({ onClose });
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('calls onClose when close button is clicked in verification step', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ email_verification_pending: true })
      });
      
      renderComponent({ onClose });
      
      // Get to verification step
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Close')).toBeInTheDocument();
      });
      
      const closeButton = screen.getByText('Close');
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    test('resets form state when closed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderComponent({ onClose });
      
      // Fill in form
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      
      await user.type(newEmailInput, 'test@example.com');
      await user.type(confirmEmailInput, 'different@example.com');
      
      // Trigger validation error
      const submitButton = screen.getByText('Send Verification Email');
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('Email addresses do not match')).toBeInTheDocument();
      });
      
      // Close and reopen
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      const { rerender } = renderComponent({ onClose, isOpen: false });
      rerender(<EmailChangeModal isOpen={true} onClose={onClose} currentEmail="current@example.com" onEmailChangeRequested={jest.fn()} />);
      
      // Form should be reset
      expect(screen.getByTestId('input-enter-new-email-address')).toHaveValue('');
      expect(screen.getByTestId('input-confirm-new-email-address')).toHaveValue('');
      expect(screen.queryByText('Email addresses do not match')).not.toBeInTheDocument();
    });
  });

  describe('API Configuration', () => {
    test('uses buildApiUrl for API endpoints', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ email_verification_pending: true })
      });
      
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      const submitButton = screen.getByText('Send Verification Email');
      
      await user.type(newEmailInput, 'new@example.com');
      await user.type(confirmEmailInput, 'new@example.com');
      await user.click(submitButton);
      
      expect(mockBuildApiUrl).toHaveBeenCalledWith('/users/profile');
    });
  });

  describe('Form Requirements', () => {
    test('requires email inputs to be filled', () => {
      renderComponent();
      
      const newEmailInput = screen.getByTestId('input-enter-new-email-address');
      const confirmEmailInput = screen.getByTestId('input-confirm-new-email-address');
      
      expect(newEmailInput).toHaveAttribute('required');
      expect(confirmEmailInput).toHaveAttribute('required');
      expect(newEmailInput).toHaveAttribute('type', 'email');
      expect(confirmEmailInput).toHaveAttribute('type', 'email');
    });

    test('has appropriate placeholders', () => {
      renderComponent();
      
      expect(screen.getByTestId('input-enter-new-email-address')).toHaveAttribute('placeholder', 'Enter new email address');
      expect(screen.getByTestId('input-confirm-new-email-address')).toHaveAttribute('placeholder', 'Confirm new email address');
    });
  });

  describe('Accessibility', () => {
    test('has proper form structure with labels', () => {
      renderComponent();
      
      expect(screen.getByText('Current Email')).toBeInTheDocument();
      expect(screen.getByText('New Email Address')).toBeInTheDocument();
      expect(screen.getByText('Confirm New Email')).toBeInTheDocument();
    });

    test('uses semantic HTML elements', () => {
      renderComponent();
      
      const form = screen.getByRole('form') || screen.getByTestId('dialog-content').querySelector('form');
      expect(form).toBeInTheDocument();
    });

    test('provides proper button types', () => {
      renderComponent();
      
      const submitButton = screen.getByText('Send Verification Email');
      const cancelButton = screen.getByText('Cancel');
      
      expect(submitButton).toHaveAttribute('type', 'submit');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });
  });
});