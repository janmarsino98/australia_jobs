import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobPage from '../JobPage'
import httpClient from '../../httpClient'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}))

jest.mock('../../components/molecules/SearchBox', () => {
  return function SearchBox({ onSearch, showAdvancedSearch, defaultValue }: any) {
    return (
      <div data-testid="search-box">
        <input 
          placeholder="Search for jobs..." 
          defaultValue={defaultValue}
          onChange={(e) => onSearch && onSearch(e.target.value)}
        />
        {showAdvancedSearch && <div>Advanced Search</div>}
      </div>
    )
  }
})

jest.mock('../../components/molecules/LocationDisplayer', () => {
  return function LocationDisplayer() {
    return <div data-testid="location-displayer">Location Filter</div>
  }
})

jest.mock('../../components/molecules/MiniJobCard', () => {
  return function MiniJobCard({ jobTitle, jobImg, jobSchedule, jobType }: any) {
    return (
      <div data-testid="mini-job-card">
        <span>{jobTitle}</span>
        <span>{jobType}</span>
        <span>{jobSchedule}</span>
      </div>
    )
  }
})

jest.mock('../../components/molecules/CategoryChooser', () => {
  return function CategoryChooser({ onCategoryChange }: any) {
    return (
      <div data-testid="category-chooser">
        <button onClick={() => onCategoryChange(['cleaning'])}>
          Select Category
        </button>
      </div>
    )
  }
})

jest.mock('../../components/molecules/NoResumeAlert', () => {
  return function NoResumeAlert() {
    return <div data-testid="no-resume-alert">No Resume Alert</div>
  }
})

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>

const mockJobs = [
  {
    _id: '1',
    jobtype: 'Cleaning Specialist',
    avatar: 'job1.jpg',
    remuneration_period: 'hourly',
    title: 'Office Cleaner',
    firm: 'Clean Corp',
    location: { city: 'Sydney', state: 'NSW' }
  },
  {
    _id: '2',
    jobtype: 'Maintenance',
    avatar: 'job2.jpg',
    remuneration_period: 'weekly',
    title: 'Building Maintenance',
    firm: 'Facility Services',
    location: { city: 'Melbourne', state: 'VIC' }
  }
]

const renderJobPage = () => {
  return render(
    <BrowserRouter>
      <JobPage />
    </BrowserRouter>
  )
}

describe('JobPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHttpClient.get.mockResolvedValue({ data: mockJobs })
  })

  test('renders page layout correctly', async () => {
    renderJobPage()
    
    expect(screen.getByTestId('search-box')).toBeInTheDocument()
    expect(screen.getByTestId('location-displayer')).toBeInTheDocument()
    expect(screen.getByTestId('category-chooser')).toBeInTheDocument()
    expect(screen.getByTestId('no-resume-alert')).toBeInTheDocument()
    expect(screen.getByText('Cleaner jobs')).toBeInTheDocument()
  })

  test('fetches jobs on initial load', async () => {
    renderJobPage()
    
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith('/jobs/get?type=')
    })
  })

  test('displays job cards when data is loaded', async () => {
    renderJobPage()
    
    await waitFor(() => {
      expect(screen.getByText('Cleaning Specialist')).toBeInTheDocument()
      expect(screen.getByText('Maintenance')).toBeInTheDocument()
    })
    
    const jobCards = screen.getAllByTestId('mini-job-card')
    expect(jobCards).toHaveLength(2)
  })

  test('handles category selection', async () => {
    const user = userEvent.setup()
    renderJobPage()
    
    const categoryButton = screen.getByText('Select Category')
    await user.click(categoryButton)
    
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith('/jobs/get?type=cleaning')
    })
  })

  test('handles loading state', async () => {
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    
    mockHttpClient.get.mockReturnValue(pendingPromise as any)
    
    renderJobPage()
    
    // Loading state would be reflected in the component state
    // For now, we just verify the API call was made
    expect(mockHttpClient.get).toHaveBeenCalled()
    
    // Resolve the promise
    resolvePromise({ data: mockJobs })
    
    await waitFor(() => {
      expect(screen.getByText('Cleaning Specialist')).toBeInTheDocument()
    })
  })

  test('handles API error', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    mockHttpClient.get.mockRejectedValue(new Error('API Error'))
    
    renderJobPage()
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error while fetching jobs: ', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  test('search box configuration', () => {
    renderJobPage()
    
    const searchInput = screen.getByPlaceholderText('Search for jobs...')
    expect(searchInput).toBeInTheDocument()
    expect(searchInput).toHaveAttribute('defaultValue', '')
    
    // Advanced search should not be shown
    expect(screen.queryByText('Advanced Search')).not.toBeInTheDocument()
  })

  test('renders with proper layout structure', () => {
    const { container } = renderJobPage()
    
    const mainDiv = container.firstChild
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'min-h-screen', 'bg-white')
  })

  test('displays page title', () => {
    renderJobPage()
    
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toHaveTextContent('Cleaner jobs')
    expect(title).toHaveClass('text-[24px]', 'font-bold', 'mt-[30px]')
  })

  test('job cards receive correct props', async () => {
    renderJobPage()
    
    await waitFor(() => {
      // Check that the job data is passed correctly to MiniJobCard
      expect(screen.getByText('Cleaning Specialist')).toBeInTheDocument()
      expect(screen.getByText('hourly')).toBeInTheDocument()
      expect(screen.getByText('Maintenance')).toBeInTheDocument()
      expect(screen.getByText('weekly')).toBeInTheDocument()
    })
  })

  test('handles empty jobs response', async () => {
    mockHttpClient.get.mockResolvedValue({ data: [] })
    
    renderJobPage()
    
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalled()
    })
    
    // No job cards should be rendered
    expect(screen.queryAllByTestId('mini-job-card')).toHaveLength(0)
  })

  test('category change updates job list', async () => {
    const user = userEvent.setup()
    
    // Mock initial response
    mockHttpClient.get.mockResolvedValueOnce({ data: mockJobs })
    
    // Mock category-specific response
    const categoryJobs = [mockJobs[0]] // Only one job for cleaning category
    mockHttpClient.get.mockResolvedValueOnce({ data: categoryJobs })
    
    renderJobPage()
    
    // Wait for initial load
    await waitFor(() => {
      expect(screen.getAllByTestId('mini-job-card')).toHaveLength(2)
    })
    
    // Select category
    const categoryButton = screen.getByText('Select Category')
    await user.click(categoryButton)
    
    // Should show filtered results
    await waitFor(() => {
      expect(screen.getAllByTestId('mini-job-card')).toHaveLength(1)
    })
  })
})