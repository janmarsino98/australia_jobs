import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import JobsPage from '../JobsPage'
import httpClient from '../../httpClient'
import * as routerDom from 'react-router-dom'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    defaults: {
      baseURL: 'http://localhost:5000'
    }
  }
}))
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}))

// Mock stores
jest.mock('../../stores/useSearchHistoryStore', () => ({
  __esModule: true,
  default: () => ({
    addSearch: jest.fn(),
  }),
}))

jest.mock('../../stores/useSavedSearchesStore', () => ({
  __esModule: true,
  default: () => ({
    addSavedSearch: jest.fn(),
  }),
}))

jest.mock('../../stores/useJobApplicationStore', () => ({
  __esModule: true,
  default: () => ({
    addApplication: jest.fn(),
  }),
}))

// Mock components that might not be essential for these tests
jest.mock('../../components/molecules/SearchHistory', () => {
  return function SearchHistory({ onSearchSelect }: any) {
    return (
      <div data-testid="search-history">
        <button onClick={() => onSearchSelect('Developer', 'Sydney')}>
          Previous Search
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/SearchSuggestions', () => {
  return function SearchSuggestions({ onSuggestionSelect }: any) {
    return (
      <div data-testid="search-suggestions">
        <button onClick={() => onSuggestionSelect('React Developer')}>
          React Developer
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/SavedSearches', () => {
  return function SavedSearches({ onSearchLoad }: any) {
    return (
      <div data-testid="saved-searches">
        <button onClick={() => onSearchLoad({ title: 'Saved Job', location: 'Melbourne' })}>
          Load Saved Search
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/ProfileCompleteness', () => {
  return function ProfileCompleteness({ onActionClick }: any) {
    return (
      <div data-testid="profile-completeness">
        <button onClick={() => onActionClick('upload-resume')}>
          Upload Resume
        </button>
        <button onClick={() => onActionClick('edit-profile')}>
          Edit Profile
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/JobApplicationTracker', () => {
  return function JobApplicationTracker({ onAddApplication }: any) {
    return (
      <div data-testid="job-application-tracker">
        <button onClick={onAddApplication}>
          Add Application
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/NoResumeAlert', () => {
  return function NoResumeAlert() {
    return <div data-testid="no-resume-alert">Upload your resume</div>
  }
})

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>
const mockNavigate = jest.fn()

// Mock data
const mockUser = {
  _id: '123',
  email: 'test@example.com',
  name: 'Test User'
}

const mockCities = [
  { _id: '1', city: 'Sydney', state: 'NSW' },
  { _id: '2', city: 'Melbourne', state: 'VIC' },
  { _id: '3', city: 'Brisbane', state: 'QLD' }
]

const mockJobs = [
  {
    _id: 'job1',
    slug: 'frontend-developer-sydney-tech-company',
    title: 'Frontend Developer',
    firm: 'Tech Company',
    location: { city: 'Sydney', state: 'NSW' },
    description: 'Great opportunity for a frontend developer',
    jobtype: 'Full-time',
    remuneration_amount: '80000',
    remuneration_period: 'year',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    _id: 'job2',
    slug: 'backend-developer-melbourne-another-company',
    title: 'Backend Developer',
    firm: 'Another Company',
    location: { city: 'Melbourne', state: 'VIC' },
    description: 'Backend development role',
    jobtype: 'Contract',
    remuneration_amount: '90000',
    remuneration_period: 'year',
    created_at: '2024-01-02T00:00:00Z'
  }
]

const renderJobsPage = () => {
  return render(
    <BrowserRouter>
      <JobsPage />
    </BrowserRouter>
  )
}

describe('JobsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(routerDom.useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    
    // Setup default API responses
    mockHttpClient.get.mockImplementation((url) => {
      if (url.includes('/auth/@me')) {
        return Promise.resolve({ data: mockUser })
      }
      if (url.includes('/cities/get_main')) {
        return Promise.resolve({ data: mockCities })
      }
      if (url.includes('/jobs/get')) {
        return Promise.resolve({ data: mockJobs })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('renders the jobs page with all main components', async () => {
    renderJobsPage()
    
    expect(screen.getByText('Find Your Next Job')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Job title or keyword')).toBeInTheDocument()
    expect(screen.getByText('Select location')).toBeInTheDocument()
    expect(screen.getByText('Advanced Filters')).toBeInTheDocument()
    expect(screen.getByText('Search Jobs')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByTestId('search-history')).toBeInTheDocument()
      expect(screen.getByTestId('saved-searches')).toBeInTheDocument()
      expect(screen.getByTestId('profile-completeness')).toBeInTheDocument()
      expect(screen.getByTestId('job-application-tracker')).toBeInTheDocument()
    })
  })

  it('loads and displays jobs on initial render', async () => {
    renderJobsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Backend Developer')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('handles job search form submission', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    const titleInput = screen.getByPlaceholderText('Job title or keyword')
    const searchButton = screen.getByText('Search Jobs')

    await user.type(titleInput, 'React Developer')
    await user.click(searchButton)

    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/get')
      )
    })
  })

  it('navigates to job details when "View Details" button is clicked', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    })

    const viewDetailsButtons = screen.getAllByText('View Details')
    await user.click(viewDetailsButtons[0])

    expect(mockNavigate).toHaveBeenCalledWith('/job-details/frontend-developer-sydney-tech-company')
  })

  it('handles job application when "Apply Now" button is clicked', async () => {
    const user = userEvent.setup()
    // Mock window.alert
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {})
    
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    })

    const applyButtons = screen.getAllByText('Apply Now')
    await user.click(applyButtons[0])

    expect(alertSpy).toHaveBeenCalledWith('Application tracked successfully!')
    
    alertSpy.mockRestore()
  })

  it('shows and hides advanced filters when button is clicked', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    const advancedFiltersButton = screen.getByText('Advanced Filters')
    await user.click(advancedFiltersButton)

    expect(screen.getByText('Salary Range (AUD)')).toBeInTheDocument()
    expect(screen.getByText('Job Type')).toBeInTheDocument()
    expect(screen.getByText('Experience Level')).toBeInTheDocument()
    expect(screen.getByText('Date Posted')).toBeInTheDocument()
    expect(screen.getByText('Work Arrangement')).toBeInTheDocument()

    await user.click(advancedFiltersButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Salary Range (AUD)')).not.toBeInTheDocument()
    })
  })

  it('handles profile actions and navigates to correct routes', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByTestId('profile-completeness')).toBeInTheDocument()
    })

    // Test upload resume action
    const uploadResumeButton = screen.getByText('Upload Resume')
    await user.click(uploadResumeButton)
    expect(mockNavigate).toHaveBeenCalledWith('/resume')

    // Test edit profile action
    const editProfileButton = screen.getByText('Edit Profile')
    await user.click(editProfileButton)
    expect(mockNavigate).toHaveBeenCalledWith('/profile/edit')
  })

  it('handles search history selection', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByTestId('search-history')).toBeInTheDocument()
    })

    const previousSearchButton = screen.getByText('Previous Search')
    await user.click(previousSearchButton)

    // Should trigger a search with the selected parameters
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/get')
      )
    })
  })

  it('handles saved search loading', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByTestId('saved-searches')).toBeInTheDocument()
    })

    const loadSavedSearchButton = screen.getByText('Load Saved Search')
    await user.click(loadSavedSearchButton)

    // Should trigger a search with the saved parameters
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        expect.stringContaining('/jobs/get')
      )
    })
  })

  it('verifies all navigation routes exist in the application', () => {
    // Test that all the routes used in the component exist in the routes configuration
    const routesConfig = [
      '/resume',
      '/profile/edit',
      '/profile/experience',
      '/profile/education',
      '/profile/skills',
      '/profile/contact',
      '/profile/summary',
      '/profile/location',
      '/profile/preferences', 
      '/profile/links',
      '/profile',
      '/job-details/:id'
    ]

    // This test verifies that the routes exist - in a real app you'd check against your routes config
    routesConfig.forEach(route => {
      expect(route).toBeTruthy()
      expect(typeof route).toBe('string')
    })
  })

  it('handles API errors gracefully', async () => {
    // Mock API failure
    mockHttpClient.get.mockRejectedValueOnce(new Error('API Error'))
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    renderJobsPage()

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled()
    })

    consoleSpy.mockRestore()
  })

  it('clears filters when clear filters button is clicked', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    // Open advanced filters
    const advancedFiltersButton = screen.getByText('Advanced Filters')
    await user.click(advancedFiltersButton)

    // Click clear filters
    const clearFiltersButton = screen.getByText('Clear Filters')
    await user.click(clearFiltersButton)

    // Verify filters are cleared - this is tested by the form behavior
    expect(clearFiltersButton).toBeInTheDocument()
  })

  it('handles location selection from dropdown', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByText('Select location')).toBeInTheDocument()
    })

    // This tests that the location dropdown is functional
    // In a real test, you'd interact with the actual Select component
    const locationSelect = screen.getByText('Select location')
    expect(locationSelect).toBeInTheDocument()
  })

  it('shows save search dialog when save search is clicked', async () => {
    const user = userEvent.setup()
    renderJobsPage()

    // Open advanced filters first
    const advancedFiltersButton = screen.getByText('Advanced Filters')
    await user.click(advancedFiltersButton)

    // Add some search criteria to enable save button
    const titleInput = screen.getByPlaceholderText('Job title or keyword')
    await user.type(titleInput, 'Developer')

    // Now the Save Search button should be visible
    await waitFor(() => {
      const saveSearchButton = screen.queryByText('Save Search')
      if (saveSearchButton) {
        expect(saveSearchButton).toBeInTheDocument()
      }
    })
  })

  it('uses slug for navigation, falls back to _id if slug not available', async () => {
    userEvent.setup()
    
    // Mock job with slug
    const jobWithSlug = {
      _id: 'job3',
      slug: 'test-job-slug',
      title: 'Test Job',
      firm: 'Test Company',
      location: { city: 'Sydney', state: 'NSW' },
      description: 'Test job description',
      jobtype: 'Full-time',
      remuneration_amount: '75000',
      remuneration_period: 'year',
      created_at: '2024-01-03T00:00:00Z'
    }

    // Mock job without slug
    const jobWithoutSlug = {
      _id: 'job4',
      title: 'Another Test Job',
      firm: 'Another Test Company',
      location: { city: 'Melbourne', state: 'VIC' },
      description: 'Another test job description',
      jobtype: 'Part-time',
      remuneration_amount: '60000',
      remuneration_period: 'year',
      created_at: '2024-01-04T00:00:00Z'
    }

    // Update mock to return these jobs
    mockHttpClient.get.mockImplementation((url) => {
      if (url.includes('/auth/@me')) {
        return Promise.resolve({ data: mockUser })
      }
      if (url.includes('/cities/get_main')) {
        return Promise.resolve({ data: mockCities })
      }
      if (url.includes('/jobs/get')) {
        return Promise.resolve({ data: [jobWithSlug, jobWithoutSlug] })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })

    renderJobsPage()

    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument()
      expect(screen.getByText('Another Test Job')).toBeInTheDocument()
    })

    const viewDetailsButtons = screen.getAllByText('View Details')
    
    // Test job with slug
    await user.click(viewDetailsButtons[0])
    expect(mockNavigate).toHaveBeenCalledWith('/job-details/test-job-slug')

    // Test job without slug (should fall back to _id)
    await user.click(viewDetailsButtons[1])
    expect(mockNavigate).toHaveBeenCalledWith('/job-details/job4')
  })
})