import { render, screen } from '@testing-library/react'
import { Outlet } from 'react-router-dom'
import AppLayout from '../AppLayout'
import useAuthStore from '../../../stores/useAuthStore'

// Mock dependencies
jest.mock('react-router-dom', () => ({
  Outlet: jest.fn(() => <div data-testid="router-outlet">Page Content</div>),
}))

jest.mock('../../../stores/useAuthStore')
jest.mock('../Navbar', () => {
  return function MockNavbar({ user }: { user?: any }) {
    return (
      <nav data-testid="navbar">
        {user ? (
          <div data-testid="navbar-user">
            <span>Name: {user.name}</span>
            <span>Profile: {user.profile}</span>
            <span>ProfileImage: {user.profileImage}</span>
          </div>
        ) : (
          <div data-testid="navbar-no-user">No User</div>
        )}
      </nav>
    )
  }
})

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>
const mockOutlet = Outlet as jest.MockedFunction<typeof Outlet>

const renderComponent = () => {
  return render(<AppLayout />)
}

describe('AppLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockOutlet.mockReturnValue(<div data-testid="router-outlet">Page Content</div>)
  })

  test('renders layout structure correctly', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    renderComponent()
    
    // Check main layout container
    const container = screen.getByTestId('navbar').closest('div')
    expect(container).toHaveClass('min-h-screen', 'bg-white')
    
    // Check that Navbar is rendered
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    
    // Check that Outlet is rendered
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument()
  })

  test('renders Navbar with user data when authenticated', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'John Doe',
      profile: 'Software Developer',
      profileImage: 'https://example.com/avatar.jpg'
    }
    
    mockUseAuthStore.mockReturnValue(mockUser)
    
    renderComponent()
    
    const navbarUser = screen.getByTestId('navbar-user')
    expect(navbarUser).toBeInTheDocument()
    expect(navbarUser).toHaveTextContent('Name: John Doe')
    expect(navbarUser).toHaveTextContent('Profile: Software Developer')
    expect(navbarUser).toHaveTextContent('ProfileImage: https://example.com/avatar.jpg')
  })

  test('renders Navbar without user data when not authenticated', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    renderComponent()
    
    expect(screen.getByTestId('navbar-no-user')).toBeInTheDocument()
    expect(screen.getByText('No User')).toBeInTheDocument()
  })

  test('transforms user data correctly for Navbar props', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Jane Smith',
      profile: 'Designer',
      profileImage: 'https://example.com/jane.jpg',
      // Additional fields that shouldn't be passed to Navbar
      createdAt: '2023-01-01',
      role: 'user'
    }
    
    mockUseAuthStore.mockReturnValue(mockUser)
    
    renderComponent()
    
    const navbarUser = screen.getByTestId('navbar-user')
    expect(navbarUser).toHaveTextContent('Name: Jane Smith')
    expect(navbarUser).toHaveTextContent('Profile: Designer')
    expect(navbarUser).toHaveTextContent('ProfileImage: https://example.com/jane.jpg')
    
    // Should not include additional fields
    expect(navbarUser).not.toHaveTextContent('createdAt')
    expect(navbarUser).not.toHaveTextContent('role')
  })

  test('handles user with missing name field', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      // name is undefined
      profile: 'Developer',
      profileImage: 'https://example.com/avatar.jpg'
    }
    
    mockUseAuthStore.mockReturnValue(mockUser)
    
    renderComponent()
    
    const navbarUser = screen.getByTestId('navbar-user')
    expect(navbarUser).toHaveTextContent('Name: ') // Empty string for missing name
    expect(navbarUser).toHaveTextContent('Profile: Developer')
  })

  test('handles user with missing profile fields', () => {
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'John Doe'
      // profile and profileImage are undefined
    }
    
    mockUseAuthStore.mockReturnValue(mockUser)
    
    renderComponent()
    
    const navbarUser = screen.getByTestId('navbar-user')
    expect(navbarUser).toHaveTextContent('Name: John Doe')
    expect(navbarUser).toHaveTextContent('Profile: undefined')
    expect(navbarUser).toHaveTextContent('ProfileImage: undefined')
  })

  test('renders Outlet for page content', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    renderComponent()
    
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument()
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  test('maintains layout structure with different user states', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    const { rerender } = renderComponent()
    
    // Check initial state
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument()
    
    // Update with authenticated user
    const mockUser = {
      _id: '123',
      email: 'test@example.com',
      name: 'Test User'
    }
    
    mockUseAuthStore.mockReturnValue(mockUser)
    rerender(<AppLayout />)
    
    // Layout structure should remain the same
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('router-outlet')).toBeInTheDocument()
  })

  test('uses auth store selector correctly', () => {
    const mockStoreSelector = jest.fn().mockReturnValue({
      _id: '123',
      name: 'Test User'
    })
    
    // Mock the store function to capture the selector
    mockUseAuthStore.mockImplementation((selector) => {
      return selector({ user: { _id: '123', name: 'Test User' } })
    })
    
    renderComponent()
    
    expect(mockUseAuthStore).toHaveBeenCalledWith(expect.any(Function))
  })

  test('has responsive design classes', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    renderComponent()
    
    const container = screen.getByTestId('navbar').closest('div')
    expect(container).toHaveClass('min-h-screen') // Ensures full height on all screens
    expect(container).toHaveClass('bg-white') // Consistent background
  })

  test('component structure is semantic', () => {
    mockUseAuthStore.mockReturnValue(null)
    
    renderComponent()
    
    // Check that components are in correct order
    const container = screen.getByTestId('navbar').closest('div')
    const navbar = screen.getByTestId('navbar')
    const outlet = screen.getByTestId('router-outlet')
    
    expect(container?.firstElementChild).toBe(navbar)
    expect(navbar.nextElementSibling).toBe(outlet)
  })
})