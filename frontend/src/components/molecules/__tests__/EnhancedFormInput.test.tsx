import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnhancedFormInput from '../EnhancedFormInput';
import { FaUser, FaSearch } from 'react-icons/fa';

// Mock framer-motion to avoid test issues
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <div>{children}</div>
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle" />,
  CheckCircle: () => <div data-testid="check-circle" />
}));

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaUser: () => <div data-testid="user-icon" />,
  FaSearch: () => <div data-testid="search-icon" />
}));

const renderComponent = (props: any = {}) => {
  return render(<EnhancedFormInput {...props} />);
};

describe('EnhancedFormInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders input with label', () => {
      renderComponent({ label: 'Email Address' });
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    test('renders input without label', () => {
      renderComponent({ placeholder: 'Enter text' });
      
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    test('generates correct input ID from label', () => {
      renderComponent({ label: 'Email Address' });
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'input-email-address');
    });

    test('uses custom ID when provided', () => {
      renderComponent({ label: 'Email', id: 'custom-id' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-id');
    });

    test('shows required asterisk when required is true', () => {
      renderComponent({ label: 'Password', required: true });
      
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByText('*')).toHaveClass('text-red-500');
    });
  });

  describe('Input Types and Values', () => {
    test('handles input type properly', () => {
      renderComponent({ inputType: 'email', label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('defaults to text input type', () => {
      renderComponent({ label: 'Name' });
      
      const input = screen.getByLabelText('Name');
      expect(input).toHaveAttribute('type', 'text');
    });

    test('handles value changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderComponent({ label: 'Username', onChange });
      
      const input = screen.getByLabelText('Username');
      await user.type(input, 'testuser');
      
      expect(onChange).toHaveBeenCalledTimes(8);
      expect(input).toHaveValue('testuser');
    });

    test('renders with initial value', () => {
      renderComponent({ label: 'Name', value: 'John Doe' });
      
      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    });

    test('handles placeholder text', () => {
      renderComponent({ label: 'Email', placeholder: 'Enter your email' });
      
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    test('renders start icon', () => {
      renderComponent({ label: 'Username', Icon: FaUser });
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    test('renders end icon with click handler', async () => {
      const user = userEvent.setup();
      const onEndIconClick = jest.fn();
      renderComponent({
        label: 'Search',
        endIcon: FaSearch,
        onEndIconClick
      });
      
      const button = screen.getByRole('button');
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      
      await user.click(button);
      expect(onEndIconClick).toHaveBeenCalledTimes(1);
    });

    test('end icon button is disabled when loading', () => {
      renderComponent({
        label: 'Search',
        endIcon: FaSearch,
        onEndIconClick: jest.fn(),
        isLoading: true
      });
      
      expect(screen.getByRole('button')).toBeDisabled();
    });

    test('applies correct icon colors based on state', () => {
      const { container, rerender } = renderComponent({
        label: 'Email',
        Icon: FaUser,
        error: 'Invalid email'
      });
      
      // Initially no interaction, should be gray
      const iconContainer = container.querySelector('.text-gray-500');
      expect(iconContainer).toBeInTheDocument();
      
      // With error after interaction
      rerender(
        <EnhancedFormInput
          label="Email"
          Icon={FaUser}
          error="Invalid email"
          value="test"
        />
      );
      
      const input = screen.getByLabelText('Email');
      fireEvent.blur(input); // Trigger hasInteracted
      
      // Should show error state
      const errorIcon = container.querySelector('.text-red-500');
      expect(errorIcon).toBeInTheDocument();
    });
  });

  describe('Focus and Interaction States', () => {
    test('applies focus styling when input is focused', async () => {
      const user = userEvent.setup();
      renderComponent({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      
      await user.click(input);
      expect(input).toHaveClass('border-blue-400', 'bg-blue-50/50');
    });

    test('tracks interaction state correctly', async () => {
      const user = userEvent.setup();
      renderComponent({ 
        label: 'Email',
        error: 'Invalid email'
      });
      
      const input = screen.getByLabelText('Email');
      
      // Error should not show initially (no interaction)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      
      // Focus and blur to trigger interaction
      await user.click(input);
      await user.tab();
      
      // Error should now show
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    test('sets interaction state on typing', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        error: 'Invalid email'
      });
      
      const input = screen.getByLabelText('Email');
      
      // Type to trigger interaction
      await user.type(input, 'a');
      
      // Error should show after typing
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  describe('Error and Success States', () => {
    test('displays error messages after interaction', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        error: 'Please enter a valid email address'
      });
      
      const input = screen.getByLabelText('Email');
      
      // Interact with input
      await user.click(input);
      await user.tab();
      
      // Error should be displayed
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
      expect(errorMessage).toHaveAttribute('id', 'input-email-error');
      
      // Error icon should be visible
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
    });

    test('displays success messages when appropriate', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        success: 'Email is valid',
        value: 'test@example.com'
      });
      
      const input = screen.getByLabelText('Email');
      
      // Interact with input
      await user.click(input);
      await user.tab();
      
      // Success message should be displayed
      expect(screen.getByText('Email is valid')).toBeInTheDocument();
      
      // Success icon should be visible
      expect(screen.getByTestId('check-circle')).toBeInTheDocument();
    });

    test('does not show success when there is an error', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        success: 'Email is valid',
        error: 'Email is invalid',
        value: 'test@example.com'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      // Should show error, not success
      expect(screen.getByText('Email is invalid')).toBeInTheDocument();
      expect(screen.queryByText('Email is valid')).not.toBeInTheDocument();
      expect(screen.getByTestId('alert-circle')).toBeInTheDocument();
      expect(screen.queryByTestId('check-circle')).not.toBeInTheDocument();
    });

    test('applies correct styling for error state', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        error: 'Invalid email'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      expect(input).toHaveClass('border-red-300', 'bg-red-50/50');
    });

    test('applies correct styling for success state', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        success: 'Valid email',
        value: 'test@example.com'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      expect(input).toHaveClass('border-green-300', 'bg-green-50/50');
    });
  });

  describe('Help Text', () => {
    test('displays help text when no error or success', () => {
      renderComponent({
        label: 'Password',
        helpText: 'Must be at least 8 characters long'
      });
      
      expect(screen.getByText('Must be at least 8 characters long')).toBeInTheDocument();
    });

    test('hides help text when error is shown', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Password',
        helpText: 'Must be at least 8 characters long',
        error: 'Password is too short'
      });
      
      const input = screen.getByLabelText('Password');
      await user.click(input);
      await user.tab();
      
      expect(screen.getByText('Password is too short')).toBeInTheDocument();
      expect(screen.queryByText('Must be at least 8 characters long')).not.toBeInTheDocument();
    });

    test('hides help text when success is shown', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Password',
        helpText: 'Must be at least 8 characters long',
        success: 'Strong password',
        value: 'verystrongpassword123'
      });
      
      const input = screen.getByLabelText('Password');
      await user.click(input);
      await user.tab();
      
      expect(screen.getByText('Strong password')).toBeInTheDocument();
      expect(screen.queryByText('Must be at least 8 characters long')).not.toBeInTheDocument();
    });

    test('associates help text with input via aria-describedby', () => {
      renderComponent({
        label: 'Password',
        helpText: 'Must be at least 8 characters long'
      });
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-describedby', 'input-password-help');
    });
  });

  describe('Validation Rules', () => {
    test('displays validation rules when showValidation is true', () => {
      renderComponent({
        label: 'Password',
        showValidation: true,
        validationRules: [
          'At least 8 characters',
          'Contains uppercase letter',
          'Contains number'
        ]
      });
      
      expect(screen.getByText('Requirements:')).toBeInTheDocument();
      expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
      expect(screen.getByText('Contains uppercase letter')).toBeInTheDocument();
      expect(screen.getByText('Contains number')).toBeInTheDocument();
    });

    test('does not display validation rules when showValidation is false', () => {
      renderComponent({
        label: 'Password',
        validationRules: [
          'At least 8 characters',
          'Contains uppercase letter'
        ]
      });
      
      expect(screen.queryByText('Requirements:')).not.toBeInTheDocument();
      expect(screen.queryByText('At least 8 characters')).not.toBeInTheDocument();
    });

    test('shows different colors for valid and invalid rules', () => {
      const { container } = renderComponent({
        label: 'Password',
        showValidation: true,
        validationRules: ['At least 8 characters', 'Contains number'],
        error: 'contains number' // Simulating a specific validation error
      });
      
      // First rule should appear valid (green)
      const validIndicators = container.querySelectorAll('.bg-green-400');
      expect(validIndicators).toHaveLength(1);
      
      // Second rule should appear invalid (gray)
      const invalidIndicators = container.querySelectorAll('.bg-gray-300');
      expect(invalidIndicators).toHaveLength(1);
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner when isLoading is true', () => {
      renderComponent({ label: 'Email', isLoading: true });
      
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    test('disables input when loading', () => {
      renderComponent({ label: 'Email', isLoading: true });
      
      expect(screen.getByLabelText('Email')).toBeDisabled();
    });

    test('applies loading opacity to input container', () => {
      const { container } = renderComponent({ label: 'Email', isLoading: true });
      
      const inputContainer = container.querySelector('.opacity-50.pointer-events-none');
      expect(inputContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper aria attributes with error', async () => {
      const user = userEvent.setup();
      renderComponent({ 
        label: 'Email', 
        error: 'Invalid email'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'input-email-error');
    });

    test('has proper aria attributes without error', () => {
      renderComponent({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'false');
    });

    test('associates help text with aria-describedby', () => {
      renderComponent({ 
        label: 'Password',
        helpText: 'Must be strong'
      });
      
      const input = screen.getByLabelText('Password');
      expect(input).toHaveAttribute('aria-describedby', 'input-password-help');
    });

    test('error message has proper role', async () => {
      const user = userEvent.setup();
      renderComponent({ 
        label: 'Email',
        error: 'Invalid email'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  describe('Spacing and Layout', () => {
    test('applies correct padding for start icon', () => {
      renderComponent({ 
        label: 'Email',
        Icon: FaUser
      });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('pl-12');
    });

    test('applies correct padding for end elements', () => {
      renderComponent({ 
        label: 'Search',
        endIcon: FaSearch,
        onEndIconClick: jest.fn()
      });
      
      const input = screen.getByLabelText('Search');
      expect(input).toHaveClass('pr-12');
    });

    test('applies correct padding for error state', async () => {
      const user = userEvent.setup();
      renderComponent({ 
        label: 'Email',
        error: 'Invalid'
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      expect(input).toHaveClass('pr-12');
    });
  });

  describe('Custom Props and Ref Forwarding', () => {
    test('passes through additional props', () => {
      renderComponent({
        label: 'Email',
        'data-testid': 'custom-input',
        maxLength: 50
      });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('data-testid', 'custom-input');
      expect(input).toHaveAttribute('maxLength', '50');
    });

    test('forwards ref correctly', () => {
      const ref = { current: null };
      render(<EnhancedFormInput ref={ref} label="Email" />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty validation rules array', () => {
      renderComponent({
        label: 'Password',
        showValidation: true,
        validationRules: []
      });
      
      expect(screen.queryByText('Requirements:')).not.toBeInTheDocument();
    });

    test('handles undefined values gracefully', () => {
      expect(() => {
        renderComponent({
          label: 'Email',
          value: undefined,
          error: undefined,
          success: undefined,
          helpText: undefined
        });
      }).not.toThrow();
    });

    test('handles success state without content', async () => {
      const user = userEvent.setup();
      renderComponent({
        label: 'Email',
        success: 'Valid',
        value: '' // No content
      });
      
      const input = screen.getByLabelText('Email');
      await user.click(input);
      await user.tab();
      
      // Success should not show without content
      expect(screen.queryByText('Valid')).not.toBeInTheDocument();
      expect(screen.queryByTestId('check-circle')).not.toBeInTheDocument();
    });
  });
});