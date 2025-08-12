import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../Navbar';

// Mock dependencies
const mockNavigate = jest.fn();
const mockLogout = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/jobs' }),
}));

jest.mock('../../../stores/useAuthStore', () => ({
  __esModule: true,
  default: jest.fn((selector) => {
    if (typeof selector === 'function') {
      return selector({ logout: mockLogout });
    }
    return { logout: mockLogout };
  }),
}));

jest.mock('../../../stores/useNotificationStore', () => ({
  useNotificationStore: () => ({ unreadCount: 3 }),
}));

jest.mock('../../../config', () => ({
  __esModule: true,
  default: {
    apiBaseUrl: 'http://localhost:5000',
  },
}));

// Mock child components
jest.mock('../../atoms/NavIconImg', () => {
  return function NavIconImg({ img_url, alt }: { img_url: string; alt: string }) {
    return <img src={img_url} alt={alt} data-testid="nav-logo" />;
  };
});

jest.mock('../../atoms/NavTextOption', () => {
  return function NavTextOption({ text, path, isActive, isPrimary }: any) {
    return (
      <a 
        href={path} 
        data-testid={`nav-link-${text.toLowerCase().replace(' ', '-')}`}
        className={isActive ? 'active' : isPrimary ? 'primary' : ''}
      >
        {text}
      </a>
    );
  };
});

jest.mock('../../atoms/NavProfileIcon', () => {
  return function NavProfileIcon({ profImg, alt, onClick, ...props }: any) {
    return (
      <button 
        onClick={onClick} 
        data-testid="profile-icon"
        {...props}
      >
        <img src={profImg} alt={alt} />
      </button>
    );
  };
});

jest.mock('../NotificationBell', () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <div data-testid="notification-bell" className={className}>
      Bell
    </div>
  ),
}));

const mockUser = {
  name: 'John Doe',
  profile: {
    first_name: 'John',
    last_name: 'Doe',
    profile_picture: 'https://example.com/profile.jpg',
  },
  profileImage: 'https://example.com/profile.jpg',
};

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <Navbar {...props} />
    </BrowserRouter>
  );
};

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Reset body overflow style
    document.body.style.overflow = 'unset';
  });

  test('renders logo and brand name', () => {
    renderComponent();
    
    expect(screen.getByTestId('nav-logo')).toBeInTheDocument();
    expect(screen.getByText('AustralianJobs')).toBeInTheDocument();
  });

  test('renders navigation links on desktop', () => {
    renderComponent();
    
    expect(screen.getByTestId('nav-link-find-jobs')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-about')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-pricing')).toBeInTheDocument();
  });

  test('shows sign in and sign up when user is not logged in', () => {
    renderComponent();
    
    expect(screen.getByTestId('nav-link-sign-in')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-sign-up')).toBeInTheDocument();
    expect(screen.getByTestId('nav-link-sign-up')).toHaveClass('primary');
  });

  test('shows user profile when logged in', () => {
    renderComponent({ user: mockUser });
    
    expect(screen.getByText('Welcome, John')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('profile-icon')).toBeInTheDocument();
  });

  test('navigates to homepage when logo is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const logoContainer = screen.getByRole('button', { name: /go to homepage/i });
    await user.click(logoContainer);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to homepage when logo is activated with keyboard', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const logoContainer = screen.getByRole('button', { name: /go to homepage/i });
    logoContainer.focus();
    await user.keyboard('{Enter}');
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('opens and closes profile dropdown', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const profileIcon = screen.getByTestId('profile-icon');
    await user.click(profileIcon);
    
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Sign out')).toBeInTheDocument();
  });

  test('displays unread notification count in dropdown', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const profileIcon = screen.getByTestId('profile-icon');
    await user.click(profileIcon);
    
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('handles logout from dropdown', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const profileIcon = screen.getByTestId('profile-icon');
    await user.click(profileIcon);
    
    const logoutButton = screen.getByText('Sign out');
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('opens and closes mobile menu', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    // Check if mobile menu is open
    const mobileMenu = document.querySelector('.mobile-menu');
    expect(mobileMenu).toHaveClass('translate-x-0');
    
    // Close mobile menu
    await user.click(mobileMenuButton);
    expect(mobileMenu).toHaveClass('translate-x-full');
  });

  test('opens and closes mobile search', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchButton = screen.getByLabelText('Toggle search');
    await user.click(searchButton);
    
    expect(screen.getByPlaceholderText('Search jobs, companies...')).toBeInTheDocument();
  });

  test('prevents body scroll when mobile menu is open', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  test('closes mobile menu on overlay click', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    const overlay = document.querySelector('.bg-black.bg-opacity-25');
    expect(overlay).toBeInTheDocument();
    
    await user.click(overlay!);
    
    const mobileMenu = document.querySelector('.mobile-menu');
    expect(mobileMenu).toHaveClass('translate-x-full');
  });

  test('displays user info in mobile menu when logged in', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  test('displays sign in/up buttons in mobile menu when not logged in', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    expect(screen.getByText('Welcome to AustralianJobs')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  test('handles mobile navigation', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    const homeButton = screen.getByRole('button', { name: /home/i });
    await user.click(homeButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const profileIcon = screen.getByTestId('profile-icon');
    await user.click(profileIcon);
    
    expect(screen.getByText('Your Profile')).toBeInTheDocument();
    
    // Click outside
    await user.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Your Profile')).not.toBeInTheDocument();
    });
  });

  test('handles profile image URL for MongoDB ObjectId', () => {
    const userWithObjectId = {
      ...mockUser,
      profileImage: '507f1f77bcf86cd799439011', // Valid MongoDB ObjectId
    };
    
    renderComponent({ user: userWithObjectId });
    
    const profileIcon = screen.getByTestId('profile-icon');
    const img = profileIcon.querySelector('img');
    expect(img?.src).toContain('/users/profile/image/507f1f77bcf86cd799439011');
  });

  test('handles LinkedIn profile image URL with proxy', () => {
    const userWithLinkedInImage = {
      ...mockUser,
      profileImage: 'https://media.licdn.com/profile.jpg',
    };
    
    renderComponent({ user: userWithLinkedInImage });
    
    const profileIcon = screen.getByTestId('profile-icon');
    const img = profileIcon.querySelector('img');
    expect(img?.src).toContain('/auth/image-proxy');
  });

  test('uses fallback image when no profile image is provided', () => {
    const userWithoutImage = {
      ...mockUser,
      profileImage: undefined,
      profile: {
        ...mockUser.profile,
        profile_picture: undefined,
      },
    };
    
    renderComponent({ user: userWithoutImage });
    
    const profileIcon = screen.getByTestId('profile-icon');
    const img = profileIcon.querySelector('img');
    expect(img?.src).toContain('pexels.com');
  });

  test('shows logout button in mobile menu for authenticated users', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });

  test('handles logout from mobile menu', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    const logoutButton = screen.getByRole('button', { name: /sign out/i });
    await user.click(logoutButton);
    
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('displays notification count in mobile menu', async () => {
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const mobileMenuButton = screen.getByLabelText('Toggle mobile menu');
    await user.click(mobileMenuButton);
    
    // Look for notification count in mobile menu
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('auto-focuses mobile search input', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchButton = screen.getByLabelText('Toggle search');
    await user.click(searchButton);
    
    const searchInput = screen.getByPlaceholderText('Search jobs, companies...');
    expect(searchInput).toHaveFocus();
  });

  test('handles error during logout', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    mockLogout.mockRejectedValueOnce(new Error('Logout failed'));
    
    const user = userEvent.setup();
    renderComponent({ user: mockUser });
    
    const profileIcon = screen.getByTestId('profile-icon');
    await user.click(profileIcon);
    
    const logoutButton = screen.getByText('Sign out');
    await user.click(logoutButton);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error during logout:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });

  test('shows notification bell for authenticated users only', () => {
    const { rerender } = renderComponent();
    
    expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument();
    
    rerender(
      <BrowserRouter>
        <Navbar user={mockUser} />
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
  });

  test('applies correct ARIA attributes', () => {
    renderComponent();
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    
    const navigation = screen.getByRole('navigation', { name: /main navigation/i });
    expect(navigation).toBeInTheDocument();
    
    const logoButton = screen.getByRole('button', { name: /go to homepage/i });
    expect(logoButton).toHaveAttribute('tabIndex', '0');
  });
});