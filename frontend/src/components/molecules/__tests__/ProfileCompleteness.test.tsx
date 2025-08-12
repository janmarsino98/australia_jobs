import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProfileCompleteness from '../ProfileCompleteness';
import { User } from '../../../types/store';

// Mock the UI components
jest.mock('../../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className} data-testid="card-content">{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className} data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className} data-testid="card-title">{children}</div>
}));

jest.mock('../../ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div 
      className={className} 
      data-testid="progress-bar" 
      role="progressbar" 
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  )
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  User: () => <div data-testid="user-icon" />,
  CheckCircle: () => <div data-testid="check-circle-icon" />,
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Plus: () => <div data-testid="plus-icon" />
}));

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'jobseeker',
  ...overrides
});

const renderComponent = (props: any = {}) => {
  return render(<ProfileCompleteness user={null} {...props} />);
};

describe('ProfileCompleteness', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders nothing when user is null', () => {
      const { container } = renderComponent();
      expect(container.firstChild).toBeNull();
    });

    test('renders component with basic user', () => {
      const user = createMockUser();
      renderComponent({ user });
      
      expect(screen.getByTestId('card')).toBeInTheDocument();
      expect(screen.getByText('Profile Completeness')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
    });

    test('applies custom className', () => {
      const user = createMockUser();
      renderComponent({ user, className: 'custom-class' });
      
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  describe('Completion Percentage Calculation', () => {
    test('calculates 0% completion for minimal user', () => {
      const user = createMockUser({
        name: undefined,
        email: 'test@example.com' // Only email is present
      });
      renderComponent({ user });
      
      // Basic info requires both name and email (0%)
      // All other sections are incomplete (0%)
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    test('calculates correct percentage for partially complete user', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a professional bio with more than fifty characters to meet the requirement'
      });
      renderComponent({ user });
      
      // Basic info (20%) + Contact (10%) + Bio (15%) = 45%
      expect(screen.getByText('45%')).toBeInTheDocument();
    });

    test('calculates 100% completion for fully complete user', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a comprehensive professional bio with more than fifty characters to meet the bio requirement',
        location: {
          city: 'Sydney',
          state: 'NSW'
        },
        experience: 'Senior Developer with 5+ years',
        education: 'Bachelor of Computer Science',
        skills: ['JavaScript', 'React', 'Node.js'],
        resumeUploaded: true,
        preferences: {
          jobTypes: ['full-time', 'contract']
        },
        linkedin: 'https://linkedin.com/in/johndoe'
      });
      renderComponent({ user });
      
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Progress Color and Messages', () => {
    test('shows red color and encouraging message for low completion', () => {
      const user = createMockUser({
        name: 'John',
        email: 'john@example.com'
      });
      renderComponent({ user });
      
      const percentage = screen.getByText('20%');
      expect(percentage).toHaveClass('text-red-600');
      expect(screen.getByText("Let's get started! Complete your profile to attract employers.")).toBeInTheDocument();
    });

    test('shows yellow color and progress message for medium completion', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a professional bio with more than fifty characters to meet the requirement',
        location: { city: 'Sydney', state: 'NSW' },
        experience: 'Senior Developer'
      });
      renderComponent({ user });
      
      const percentage = screen.getByText('75%');
      expect(percentage).toHaveClass('text-yellow-600');
      expect(screen.getByText("Good progress! A few more details will make your profile shine.")).toBeInTheDocument();
    });

    test('shows green color and excellent message for high completion', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a comprehensive professional bio with more than fifty characters to meet the bio requirement',
        location: { city: 'Sydney', state: 'NSW' },
        experience: 'Senior Developer with 5+ years',
        education: 'Bachelor of Computer Science',
        skills: ['JavaScript', 'React', 'Node.js'],
        resumeUploaded: true,
        preferences: { jobTypes: ['full-time'] }
      });
      renderComponent({ user });
      
      const percentage = screen.getByText('95%');
      expect(percentage).toHaveClass('text-green-600');
      expect(screen.getByText("Excellent! Your profile is almost complete.")).toBeInTheDocument();
    });
  });

  describe('Completed Sections Display', () => {
    test('shows completed sections with check icons', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      });
      renderComponent({ user });
      
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getAllByTestId('check-circle-icon')).toHaveLength(2);
    });

    test('limits displayed completed sections to 3', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a professional bio with more than fifty characters to meet the requirement',
        location: { city: 'Sydney', state: 'NSW' },
        experience: 'Senior Developer',
        education: 'Bachelor degree'
      });
      renderComponent({ user });
      
      // Should show first 3 completed sections
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Contact Details')).toBeInTheDocument();
      expect(screen.getByText('Professional Summary')).toBeInTheDocument();
      
      // Should show "+X more completed" message
      expect(screen.getByText('+3 more completed')).toBeInTheDocument();
    });

    test('does not show completed section if none exist', () => {
      const user = createMockUser({
        name: undefined, // Incomplete basic info
        email: 'test@example.com'
      });
      renderComponent({ user });
      
      expect(screen.queryByText('Completed')).not.toBeInTheDocument();
    });
  });

  describe('Next Steps Action Items', () => {
    test('shows action buttons for incomplete sections', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com'
        // Missing other fields
      });
      const onActionClick = jest.fn();
      renderComponent({ user, onActionClick });
      
      expect(screen.getByText('Next Steps')).toBeInTheDocument();
      expect(screen.getByText('Add Contact Details')).toBeInTheDocument();
      expect(screen.getByText('Add Professional Summary')).toBeInTheDocument();
      expect(screen.getByText('Add Location')).toBeInTheDocument();
      expect(screen.getAllByTestId('alert-circle-icon')).toHaveLength(3);
    });

    test('action buttons trigger onActionClick with correct action', async () => {
      const user = userEvent.setup();
      const onActionClick = jest.fn();
      const mockUser = createMockUser({
        name: 'John Doe',
        email: 'john@example.com'
      });
      renderComponent({ user: mockUser, onActionClick });
      
      const contactButton = screen.getByText('Add Contact Details');
      await user.click(contactButton);
      
      expect(onActionClick).toHaveBeenCalledWith('add-contact');
    });

    test('limits action items to 3 incomplete sections', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com'
        // All other 8 sections are incomplete
      });
      renderComponent({ user });
      
      const actionButtons = screen.getAllByRole('button');
      expect(actionButtons).toHaveLength(3); // Only shows first 3 incomplete
    });

    test('does not show next steps if no incomplete sections exist', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a comprehensive professional bio with more than fifty characters to meet the bio requirement',
        location: { city: 'Sydney', state: 'NSW' },
        experience: 'Senior Developer with 5+ years',
        education: 'Bachelor of Computer Science',
        skills: ['JavaScript', 'React', 'Node.js'],
        resumeUploaded: true,
        preferences: { jobTypes: ['full-time'] },
        linkedin: 'https://linkedin.com/in/johndoe'
      });
      renderComponent({ user });
      
      expect(screen.queryByText('Next Steps')).not.toBeInTheDocument();
    });
  });

  describe('Perfect Profile Message', () => {
    test('shows perfect profile message at 100% completion', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890',
        bio: 'This is a comprehensive professional bio with more than fifty characters to meet the bio requirement',
        location: { city: 'Sydney', state: 'NSW' },
        experience: 'Senior Developer with 5+ years',
        education: 'Bachelor of Computer Science',
        skills: ['JavaScript', 'React', 'Node.js'],
        resumeUploaded: true,
        preferences: { jobTypes: ['full-time'] },
        linkedin: 'https://linkedin.com/in/johndoe'
      });
      renderComponent({ user });
      
      expect(screen.getByText('Perfect! Your profile is complete and ready to impress employers.')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    test('does not show perfect profile message when less than 100%', () => {
      const user = createMockUser({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '123-456-7890'
      });
      renderComponent({ user });
      
      expect(screen.queryByText('Perfect! Your profile is complete and ready to impress employers.')).not.toBeInTheDocument();
    });
  });

  describe('Profile Section Validation', () => {
    test('validates basic information requires both name and email', () => {
      const userNoName = createMockUser({ name: undefined, email: 'test@example.com' });
      const userNoEmail = createMockUser({ name: 'John', email: undefined });
      const userBoth = createMockUser({ name: 'John', email: 'test@example.com' });
      
      // Test no name
      renderComponent({ user: userNoName });
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Test no email
      const { rerender } = renderComponent({ user: userNoEmail });
      rerender(<ProfileCompleteness user={userNoEmail} />);
      expect(screen.getByText('0%')).toBeInTheDocument();
      
      // Test both present
      rerender(<ProfileCompleteness user={userBoth} />);
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    test('validates bio requires more than 50 characters', () => {
      const userShortBio = createMockUser({
        name: 'John',
        email: 'john@example.com',
        bio: 'Short bio'
      });
      const userLongBio = createMockUser({
        name: 'John',
        email: 'john@example.com',
        bio: 'This is a much longer bio that definitely exceeds fifty characters and should be considered complete'
      });
      
      renderComponent({ user: userShortBio });
      expect(screen.getByText('20%')).toBeInTheDocument(); // Only basic info
      
      const { rerender } = renderComponent({ user: userLongBio });
      rerender(<ProfileCompleteness user={userLongBio} />);
      expect(screen.getByText('35%')).toBeInTheDocument(); // Basic + bio
    });

    test('validates location requires both city and state', () => {
      const userCityOnly = createMockUser({
        name: 'John',
        email: 'john@example.com',
        location: { city: 'Sydney' }
      });
      const userStateOnly = createMockUser({
        name: 'John',
        email: 'john@example.com',
        location: { state: 'NSW' }
      });
      const userComplete = createMockUser({
        name: 'John',
        email: 'john@example.com',
        location: { city: 'Sydney', state: 'NSW' }
      });
      
      // City only
      renderComponent({ user: userCityOnly });
      expect(screen.getByText('20%')).toBeInTheDocument();
      
      // State only
      const { rerender } = renderComponent({ user: userStateOnly });
      rerender(<ProfileCompleteness user={userStateOnly} />);
      expect(screen.getByText('20%')).toBeInTheDocument();
      
      // Both present
      rerender(<ProfileCompleteness user={userComplete} />);
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    test('validates skills requires at least 3 skills', () => {
      const userFewSkills = createMockUser({
        name: 'John',
        email: 'john@example.com',
        skills: ['JavaScript', 'React'] // Only 2 skills
      });
      const userEnoughSkills = createMockUser({
        name: 'John',
        email: 'john@example.com',
        skills: ['JavaScript', 'React', 'Node.js'] // 3 skills
      });
      
      renderComponent({ user: userFewSkills });
      expect(screen.getByText('20%')).toBeInTheDocument();
      
      const { rerender } = renderComponent({ user: userEnoughSkills });
      rerender(<ProfileCompleteness user={userEnoughSkills} />);
      expect(screen.getByText('30%')).toBeInTheDocument();
    });

    test('validates professional links accepts linkedin, github, or website', () => {
      const userLinkedIn = createMockUser({
        name: 'John',
        email: 'john@example.com',
        linkedin: 'https://linkedin.com/in/john'
      });
      const userGithub = createMockUser({
        name: 'John',
        email: 'john@example.com',
        github: 'https://github.com/john'
      });
      const userWebsite = createMockUser({
        name: 'John',
        email: 'john@example.com',
        website: 'https://johndoe.com'
      });
      
      // Each should add 5% for professional links
      renderComponent({ user: userLinkedIn });
      expect(screen.getByText('25%')).toBeInTheDocument();
      
      const { rerender } = renderComponent({ user: userGithub });
      rerender(<ProfileCompleteness user={userGithub} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
      
      rerender(<ProfileCompleteness user={userWebsite} />);
      expect(screen.getByText('25%')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('progress bar has proper ARIA attributes', () => {
      const user = createMockUser({
        name: 'John',
        email: 'john@example.com'
      });
      renderComponent({ user });
      
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '20');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('action buttons are accessible', async () => {
      const userTest = userEvent.setup();
      const onActionClick = jest.fn();
      const user = createMockUser({
        name: 'John',
        email: 'john@example.com'
      });
      renderComponent({ user, onActionClick });
      
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      
      // Test keyboard navigation
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);
      
      // Test click functionality
      await userTest.click(buttons[0]);
      expect(onActionClick).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('handles user with undefined nested properties', () => {
      const user = createMockUser({
        name: 'John',
        email: 'john@example.com',
        location: undefined,
        preferences: undefined,
        skills: undefined
      });
      
      expect(() => renderComponent({ user })).not.toThrow();
      expect(screen.getByText('20%')).toBeInTheDocument();
    });

    test('handles user with empty arrays and strings', () => {
      const user = createMockUser({
        name: 'John',
        email: 'john@example.com',
        bio: '', // Empty string
        skills: [], // Empty array
        preferences: { jobTypes: [] } // Empty nested array
      });
      
      expect(() => renderComponent({ user })).not.toThrow();
      expect(screen.getByText('20%')).toBeInTheDocument(); // Only basic info
    });
  });
});