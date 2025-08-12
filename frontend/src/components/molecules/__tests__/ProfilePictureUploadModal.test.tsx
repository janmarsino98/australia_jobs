import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfilePictureUploadModal from '../ProfilePictureUploadModal';
import useAuthStore from '../../../stores/useAuthStore';

// Mock dependencies
jest.mock('../../../stores/useAuthStore');
jest.mock('../ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock UI components
jest.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, className, ...props }: any) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${variant}`}
      {...props}
    >
      {children}
    </button>
  )
}));

jest.mock('../ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="modal" onClick={onOpenChange}>{children}</div> : null,
  DialogContent: ({ children, className }: any) => 
    <div className={className} data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children, className }: any) => 
    <div className={className} data-testid="dialog-footer">{children}</div>
}));

jest.mock('../ui/alert', () => ({
  Alert: ({ children, className }: any) => 
    <div className={className} data-testid="alert">{children}</div>,
  AlertDescription: ({ children, className }: any) => 
    <div className={className} data-testid="alert-description">{children}</div>
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Camera: () => <div data-testid="camera-icon" />,
  Upload: () => <div data-testid="upload-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  Loader2: () => <div data-testid="loader-icon" />
}));

// Mock global fetch
global.fetch = jest.fn();
global.URL.createObjectURL = jest.fn();
global.URL.revokeObjectURL = jest.fn();

const mockAuthStore = {
  getState: jest.fn(() => ({
    setUser: jest.fn()
  }))
};

const mockToast = jest.fn();

const renderComponent = (props: any = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    ...props
  };
  return render(<ProfilePictureUploadModal {...defaultProps} />);
};

// Helper to create mock File
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type });
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false
  });
  return file;
};

describe('ProfilePictureUploadModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuthStore as jest.Mock).mockReturnValue(mockAuthStore);
    (global.fetch as jest.Mock).mockClear();
    (global.URL.createObjectURL as jest.Mock).mockReturnValue('mock-url');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders modal when isOpen is true', () => {
      renderComponent();
      
      expect(screen.getByTestId('modal')).toBeInTheDocument();
      expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
      expect(screen.getByText('Update Profile Picture')).toBeInTheDocument();
    });

    test('does not render when isOpen is false', () => {
      renderComponent({ isOpen: false });
      
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
    });

    test('renders camera icon in title', () => {
      renderComponent();
      
      expect(screen.getByTestId('camera-icon')).toBeInTheDocument();
    });

    test('renders description for new profile picture', () => {
      renderComponent();
      
      expect(screen.getByText('Choose a new profile picture to personalize your profile.')).toBeInTheDocument();
    });

    test('renders replacement warning when current picture exists', () => {
      renderComponent({ currentProfilePicture: 'current-pic.jpg' });
      
      expect(screen.getByText('Uploading a new picture will replace your current profile picture permanently.')).toBeInTheDocument();
    });
  });

  describe('Warning Display', () => {
    test('shows warning alert when current profile picture exists', () => {
      renderComponent({ currentProfilePicture: 'current-pic.jpg' });
      
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
      expect(screen.getByText('Your current profile picture will be permanently deleted and cannot be recovered.')).toBeInTheDocument();
    });

    test('does not show warning when no current profile picture', () => {
      renderComponent();
      
      const alerts = screen.getAllByTestId('alert');
      const warningAlert = alerts.find(alert => 
        alert.className.includes('border-orange-200')
      );
      expect(warningAlert).toBeUndefined();
    });
  });

  describe('File Selection', () => {
    test('renders file selection button initially', () => {
      renderComponent();
      
      expect(screen.getByTestId('upload-icon')).toBeInTheDocument();
      expect(screen.getByText('Select Image')).toBeInTheDocument();
    });

    test('handles file selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const fileInput = screen.getByRole('button', { name: /select image/i });
      
      // Mock file input
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(file);
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('validates file type', async () => {
      renderComponent();
      
      const invalidFile = createMockFile('test.txt', 1000, 'text/plain');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [invalidFile],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Please select a valid image file (JPEG, PNG, GIF, or WEBP)')).toBeInTheDocument();
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('validates file size', async () => {
      renderComponent();
      
      const largeFile = createMockFile('large.jpg', 6 * 1024 * 1024, 'image/jpeg'); // 6MB
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [largeFile],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [largeFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('File size must be less than 5MB')).toBeInTheDocument();
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('accepts valid file types', async () => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      
      for (const type of validTypes) {
        renderComponent();
        
        const validFile = createMockFile(`test.${type.split('/')[1]}`, 1000, type);
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'file';
        hiddenInput.style.display = 'none';
        document.body.appendChild(hiddenInput);
        
        Object.defineProperty(hiddenInput, 'files', {
          value: [validFile],
          writable: false
        });
        
        fireEvent.change(hiddenInput, { target: { files: [validFile] } });
        
        await waitFor(() => {
          expect(global.URL.createObjectURL).toHaveBeenCalledWith(validFile);
        });
        
        document.body.removeChild(hiddenInput);
        
        // Clear mocks for next iteration
        jest.clearAllMocks();
        (global.URL.createObjectURL as jest.Mock).mockReturnValue('mock-url');
      }
    });
  });

  describe('Image Preview', () => {
    test('shows preview after file selection', async () => {
      renderComponent();
      
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        const preview = screen.getByAltText('Profile preview');
        expect(preview).toBeInTheDocument();
        expect(preview).toHaveAttribute('src', 'mock-url');
      });
      
      expect(screen.getByText('Choose Different Image')).toBeInTheDocument();
      
      document.body.removeChild(hiddenInput);
    });

    test('allows changing image after selection', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      // Select first file
      const file1 = createMockFile('test1.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file1],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file1] } });
      
      await waitFor(() => {
        expect(screen.getByText('Choose Different Image')).toBeInTheDocument();
      });
      
      // Click to change image
      const changeBButton = screen.getByText('Choose Different Image');
      await user.click(changeButton);
      
      // This would trigger the file input click
      expect(changeBButton).toBeInTheDocument();
      
      document.body.removeChild(hiddenInput);
    });
  });

  describe('File Upload', () => {
    test('uploads file successfully', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      const mockResponse = {
        ok: true,
        json: () => Promise.resolve({
          _id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'jobseeker',
          profileImage: 'new-profile-pic.jpg'
        })
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse);
      
      renderComponent({ onClose });
      
      // Simulate file selection
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
      
      // Click upload button
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/users/profile/image',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          body: expect.any(FormData)
        })
      );
      
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('shows loading state during upload', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ _id: 'user123', profileImage: 'new-pic.jpg' })
          }), 100)
        )
      );
      
      renderComponent();
      
      // Select file
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
      
      // Click upload
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      // Should show loading state
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
      expect(uploadButton).toBeDisabled();
      
      document.body.removeChild(hiddenInput);
    });

    test('handles upload error', async () => {
      const user = userEvent.setup();
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Upload failed' })
      });
      
      renderComponent();
      
      // Select file and upload
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(screen.getByText('Upload failed')).toBeInTheDocument();
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('disables upload button when no file selected', () => {
      renderComponent();
      
      const uploadButton = screen.getByText('Upload');
      expect(uploadButton).toBeDisabled();
    });

    test('updates auth store after successful upload', async () => {
      const user = userEvent.setup();
      const mockSetUser = jest.fn();
      
      (useAuthStore as jest.Mock).mockReturnValue({
        getState: () => ({ setUser: mockSetUser })
      });
      
      const mockUserData = {
        _id: 'user123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'jobseeker',
        profileImage: 'new-profile-pic.jpg'
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserData)
      });
      
      renderComponent();
      
      // Select file and upload
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
      
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(expect.objectContaining({
          id: 'user123',
          email: 'test@example.com',
          name: 'Test User',
          role: 'jobseeker',
          profileImage: 'new-profile-pic.jpg'
        }));
      });
      
      document.body.removeChild(hiddenInput);
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

    test('cleans up preview URL on close', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderComponent({ onClose });
      
      // Select file to create preview
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalled();
      });
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
      expect(onClose).toHaveBeenCalled();
      
      document.body.removeChild(hiddenInput);
    });

    test('resets all state on close', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      renderComponent({ onClose });
      
      // Select file and trigger error
      const invalidFile = createMockFile('test.txt', 1000, 'text/plain');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [invalidFile],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByText('Please select a valid image file (JPEG, PNG, GIF, or WEBP)')).toBeInTheDocument();
      });
      
      // Close and reopen
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Error should be cleared
      const { rerender } = renderComponent({ onClose, isOpen: false });
      rerender(<ProfilePictureUploadModal isOpen={true} onClose={onClose} />);
      
      expect(screen.queryByText('Please select a valid image file (JPEG, PNG, GIF, or WEBP)')).not.toBeInTheDocument();
      
      document.body.removeChild(hiddenInput);
    });
  });

  describe('Requirements Display', () => {
    test('shows file requirements', () => {
      renderComponent();
      
      expect(screen.getByText('Requirements:')).toBeInTheDocument();
      expect(screen.getByText('File formats: JPEG, PNG, GIF, WEBP')).toBeInTheDocument();
      expect(screen.getByText('Maximum file size: 5MB')).toBeInTheDocument();
      expect(screen.getByText('Recommended size: 800x800 pixels')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('has proper alt text for preview image', async () => {
      renderComponent();
      
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        const preview = screen.getByAltText('Profile preview');
        expect(preview).toBeInTheDocument();
      });
      
      document.body.removeChild(hiddenInput);
    });

    test('file input has proper accept attribute', () => {
      const { container } = renderComponent();
      
      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    test('buttons are disabled appropriately during loading', async () => {
      const user = userEvent.setup();
      
      // Mock delayed response
      (global.fetch as jest.Mock).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ _id: 'user123' })
          }), 100)
        )
      );
      
      renderComponent();
      
      // Select file
      const file = createMockFile('test.jpg', 1000, 'image/jpeg');
      const hiddenInput = document.createElement('input');
      hiddenInput.type = 'file';
      hiddenInput.style.display = 'none';
      document.body.appendChild(hiddenInput);
      
      Object.defineProperty(hiddenInput, 'files', {
        value: [file],
        writable: false
      });
      
      fireEvent.change(hiddenInput, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByText('Upload')).toBeInTheDocument();
      });
      
      // Start upload
      const uploadButton = screen.getByText('Upload');
      await user.click(uploadButton);
      
      // Both buttons should be disabled
      expect(uploadButton).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      
      document.body.removeChild(hiddenInput);
    });
  });
});