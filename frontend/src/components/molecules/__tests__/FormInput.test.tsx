import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormInput from '../FormInput';
import { FaUser, FaSearch } from 'react-icons/fa';

// Mock react-icons to avoid issues with icon rendering
jest.mock('react-icons/fa', () => ({
  FaRegEye: () => <div data-testid="eye-icon" />,
  FaRegEyeSlash: () => <div data-testid="eye-slash-icon" />,
  FaUser: () => <div data-testid="user-icon" />,
  FaSearch: () => <div data-testid="search-icon" />
}));

jest.mock('react-icons/cg', () => ({
  CgSpinner: () => <div data-testid="spinner-icon" />
}));

const renderFormInput = (props = {}) => {
  return render(<FormInput {...props} />);
};

describe('FormInput', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders input with label', () => {
      renderFormInput({ label: 'Email Address' });
      
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByText('Email Address')).toBeInTheDocument();
    });

    test('renders input without label', () => {
      renderFormInput({ placeholder: 'Enter text' });
      
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    test('generates correct input ID from label', () => {
      renderFormInput({ label: 'Email Address' });
      
      const input = screen.getByLabelText('Email Address');
      expect(input).toHaveAttribute('id', 'input-email-address');
    });

    test('uses custom ID when provided', () => {
      renderFormInput({ label: 'Email', id: 'custom-id' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  describe('Input Types and Values', () => {
    test('handles value changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      renderFormInput({ label: 'Username', onChange });
      
      const input = screen.getByLabelText('Username');
      await user.type(input, 'testuser');
      
      expect(onChange).toHaveBeenCalledTimes(8); // Called for each character
      expect(input).toHaveValue('testuser');
    });

    test('supports different input types', () => {
      const { rerender } = renderFormInput({ 
        label: 'Email', 
        inputType: 'email' 
      });
      
      expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
      
      rerender(<FormInput label="Password" inputType="password" />);
      expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
      
      rerender(<FormInput label="Phone" inputType="tel" />);
      expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel');
    });

    test('renders with initial value', () => {
      renderFormInput({ label: 'Name', value: 'John Doe' });
      
      expect(screen.getByLabelText('Name')).toHaveValue('John Doe');
    });
  });

  describe('Password Functionality', () => {
    test('password toggle button appears for password inputs', () => {
      renderFormInput({ label: 'Password', inputType: 'password' });
      
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });

    test('toggles password visibility', async () => {
      const user = userEvent.setup();
      renderFormInput({ label: 'Password', inputType: 'password' });
      
      const input = screen.getByLabelText('Password');
      const toggleButton = screen.getByLabelText('Show password');
      
      // Initially should be password type
      expect(input).toHaveAttribute('type', 'password');
      
      // Click to show password
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Hide password')).toBeInTheDocument();
      expect(screen.getByTestId('eye-slash-icon')).toBeInTheDocument();
      
      // Click to hide password again
      await user.click(toggleButton);
      expect(input).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });

    test('password toggle is disabled when loading', () => {
      renderFormInput({ 
        label: 'Password', 
        inputType: 'password', 
        isLoading: true 
      });
      
      expect(screen.getByLabelText('Show password')).toBeDisabled();
    });
  });

  describe('Icons', () => {
    test('renders start icon', () => {
      renderFormInput({ label: 'Username', Icon: FaUser });
      
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    test('renders end icon with click handler', async () => {
      const user = userEvent.setup();
      const onEndIconClick = jest.fn();
      renderFormInput({ 
        label: 'Search', 
        endIcon: FaSearch, 
        onEndIconClick 
      });
      
      const endIconButton = screen.getByRole('button');
      expect(screen.getByTestId('search-icon')).toBeInTheDocument();
      
      await user.click(endIconButton);
      expect(onEndIconClick).toHaveBeenCalledTimes(1);
    });

    test('end icon button is disabled when loading', () => {
      renderFormInput({ 
        label: 'Search', 
        endIcon: FaSearch, 
        onEndIconClick: jest.fn(),
        isLoading: true 
      });
      
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    test('displays error messages', () => {
      renderFormInput({ 
        label: 'Email', 
        error: 'Please enter a valid email address' 
      });
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Please enter a valid email address');
      expect(errorMessage).toHaveAttribute('id', 'input-email-error');
    });

    test('associates error with input via aria-describedby', () => {
      renderFormInput({ 
        label: 'Email', 
        error: 'Invalid email' 
      });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'input-email-error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    test('applies error styling only when input has content and error exists', async () => {
      const user = userEvent.setup();
      const { container } = renderFormInput({ 
        label: 'Email', 
        error: 'Invalid email' 
      });
      
      const input = screen.getByLabelText('Email');
      const inputContainer = container.querySelector('.input-container');
      
      // Initially no error styling (no content)
      expect(inputContainer).not.toHaveClass('claude-invalid');
      
      // Type something to trigger hasContent
      await user.type(input, 'test');
      
      // Now should have error styling
      expect(inputContainer).toHaveClass('claude-invalid');
    });

    test('removes error styling when error is cleared', async () => {
      const user = userEvent.setup();
      const { container, rerender } = renderFormInput({ 
        label: 'Email', 
        error: 'Invalid email' 
      });
      
      const input = screen.getByLabelText('Email');
      await user.type(input, 'test');
      
      const inputContainer = container.querySelector('.input-container');
      expect(inputContainer).toHaveClass('claude-invalid');
      
      // Clear error
      rerender(<FormInput label="Email" />);
      expect(inputContainer).not.toHaveClass('claude-invalid');
    });
  });

  describe('Loading States', () => {
    test('shows loading spinner when loading', () => {
      renderFormInput({ label: 'Email', isLoading: true });
      
      expect(screen.getByTestId('spinner-icon')).toBeInTheDocument();
    });

    test('disables input when loading', () => {
      renderFormInput({ label: 'Email', isLoading: true });
      
      expect(screen.getByLabelText('Email')).toBeDisabled();
    });

    test('applies loading opacity to container', () => {
      const { container } = renderFormInput({ label: 'Email', isLoading: true });
      
      const inputContainer = container.querySelector('.input-container');
      expect(inputContainer).toHaveClass('opacity-50', 'pointer-events-none');
    });
  });

  describe('Focus and Blur Behavior', () => {
    test('applies focus styling when input is focused', async () => {
      const user = userEvent.setup();
      const { container } = renderFormInput({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      const inputContainer = container.querySelector('.input-container');
      
      await user.click(input);
      expect(inputContainer).toHaveClass('claude-focused');
    });

    test('removes focus styling when input loses focus', async () => {
      const user = userEvent.setup();
      const { container } = renderFormInput({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      const inputContainer = container.querySelector('.input-container');
      
      await user.click(input);
      expect(inputContainer).toHaveClass('claude-focused');
      
      await user.tab(); // Move focus away
      
      await waitFor(() => {
        expect(inputContainer).not.toHaveClass('claude-focused');
      });
    });

    test('handles document click to blur input', async () => {
      const user = userEvent.setup();
      const { container } = renderFormInput({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      const inputContainer = container.querySelector('.input-container');
      
      await user.click(input);
      expect(inputContainer).toHaveClass('claude-focused');
      
      // Click outside the input
      await user.click(document.body);
      
      await waitFor(() => {
        expect(inputContainer).not.toHaveClass('claude-focused');
      });
    });
  });

  describe('Accessibility', () => {
    test('has proper aria attributes', () => {
      renderFormInput({ label: 'Email', error: 'Invalid email' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby', 'input-email-error');
    });

    test('aria attributes are correct without error', () => {
      renderFormInput({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).not.toHaveAttribute('aria-describedby');
    });

    test('icons have aria-hidden attribute', () => {
      renderFormInput({ 
        label: 'Search', 
        Icon: FaUser, 
        endIcon: FaSearch, 
        onEndIconClick: jest.fn() 
      });
      
      const userIcon = screen.getByTestId('user-icon');
      const searchIcon = screen.getByTestId('search-icon');
      
      expect(userIcon).toHaveAttribute('aria-hidden', 'true');
      expect(searchIcon).toHaveAttribute('aria-hidden', 'true');
    });

    test('password toggle has proper aria-label', () => {
      renderFormInput({ label: 'Password', inputType: 'password' });
      
      expect(screen.getByLabelText('Show password')).toBeInTheDocument();
    });
  });

  describe('Custom Props and Styling', () => {
    test('accepts custom className', () => {
      renderFormInput({ 
        label: 'Email', 
        className: 'custom-input-class' 
      });
      
      const input = screen.getByLabelText('Email');
      expect(input).toHaveClass('custom-input-class');
    });

    test('passes through additional props', () => {
      renderFormInput({ 
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
      render(<FormInput ref={ref} label="Email" />);
      
      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });
  });

  describe('Content State Tracking', () => {
    test('tracks content state for styling', async () => {
      const user = userEvent.setup();
      const { container } = renderFormInput({ label: 'Email' });
      
      const input = screen.getByLabelText('Email');
      const inputContainer = container.querySelector('.input-container');
      
      // Initially should have default styling
      expect(inputContainer).toHaveClass('claude-default');
      
      // Type content
      await user.type(input, 'test');
      
      // Should still have default styling (no error or valid state)
      expect(inputContainer).toHaveClass('claude-default');
      
      // Clear content
      await user.clear(input);
      
      // Should return to default styling
      expect(inputContainer).toHaveClass('claude-default');
    });
  });
});