import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobManagementPage from '../JobManagementPage'
import httpClient from '../../httpClient'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
    patch: jest.fn(),
    delete: jest.fn(),
    post: jest.fn()
  }
}))

jest.mock('../../config', () => ({
  __esModule: true,
  default: {
    apiBaseUrl: 'http://localhost:5000'
  }
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

jest.mock('../../stores/useAuthStore', () => ({
  __esModule: true,
  default: () => ({
    user: {
      _id: 'employer-123',
      email: 'employer@company.com',
      profile: { display_name: 'Test Company' }
    }
  })
}))

jest.mock('../../components/ui/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}))

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}))

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>
const mockNavigate = jest.fn()
const mockToast = jest.fn()

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn()
  }
})

// Mock window.confirm
Object.assign(window, {
  confirm: jest.fn(() => true)
})

const renderJobManagementPage = () => {
  return render(
    <BrowserRouter>
      <JobManagementPage />
    </BrowserRouter>
  )
}

describe('JobManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    ;(require('../../components/ui/use-toast').useToast as jest.Mock).mockReturnValue({
      toast: mockToast
    })
  })

  test('renders loading state initially', () => {
    renderJobManagementPage()
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  test('renders job management page with header and stats', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Job Management')).toBeInTheDocument()
      expect(screen.getByText('Manage your job postings and track their performance')).toBeInTheDocument()
    })

    // Check stats cards
    expect(screen.getByText('Active Jobs')).toBeInTheDocument()
    expect(screen.getByText('Total Applications')).toBeInTheDocument()
    expect(screen.getByText('Total Views')).toBeInTheDocument()
    expect(screen.getByText('Avg. Conversion')).toBeInTheDocument()
  })

  test('displays job listings with correct information', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Product Manager')).toBeInTheDocument()
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Marketing Specialist')).toBeInTheDocument()
    })

    // Check job details
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
    expect(screen.getByText('Melbourne, VIC')).toBeInTheDocument()
    expect(screen.getByText('full-time • hybrid')).toBeInTheDocument()
    expect(screen.getByText('$120,000 - $150,000 year')).toBeInTheDocument()
  })

  test('displays correct status badges and icons', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Paused')).toBeInTheDocument()
      expect(screen.getByText('Draft')).toBeInTheDocument()
    })
  })

  test('displays performance metrics for each job', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      // Check applications count
      expect(screen.getByText('47')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
      
      // Check views
      expect(screen.getByText('1,234')).toBeInTheDocument()
      expect(screen.getByText('567')).toBeInTheDocument()
    })
  })

  test('handles search functionality', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search jobs by title, department, or location...')
    await user.type(searchInput, 'Senior')
    
    // Should still show Senior Software Engineer
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    
    // Clear search and try different term
    await user.clear(searchInput)
    await user.type(searchInput, 'Marketing')
    
    expect(screen.getByText('Marketing Specialist')).toBeInTheDocument()
  })

  test('handles status filter', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const statusFilter = screen.getByDisplayValue('All Status')
    await user.selectOptions(statusFilter, 'draft')
    
    // Should show only draft jobs
    expect(screen.getByText('Marketing Specialist')).toBeInTheDocument()
  })

  test('handles sort by options', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const sortSelect = screen.getByDisplayValue('Date Created')
    await user.selectOptions(sortSelect, 'applications')
    
    // Jobs should be sorted by applications (Senior Software Engineer has most applications)
    const jobTitles = screen.getAllByText(/Engineer|Manager|Developer|Specialist/)
    expect(jobTitles[0]).toHaveTextContent('Senior Software Engineer')
  })

  test('handles job selection and bulk actions', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    // Select first job
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    
    // Should show bulk actions
    expect(screen.getByText('1 job selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  test('handles post new job button', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Job Management')).toBeInTheDocument()
    })

    const postJobButton = screen.getByRole('button', { name: 'Post New Job' })
    await user.click(postJobButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/post-job')
  })

  test('handles view job action', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const viewButtons = screen.getAllByRole('button', { name: 'View' })
    await user.click(viewButtons[0])
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs/1')
  })

  test('handles edit job action', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByRole('button', { name: 'Edit' })
    await user.click(editButtons[0])
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs/1/edit')
  })

  test('handles pause job action', async () => {
    const user = userEvent.setup()
    mockHttpClient.patch.mockResolvedValue({ data: { success: true } })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const pauseButton = screen.getByRole('button', { name: 'Pause' })
    await user.click(pauseButton)
    
    await waitFor(() => {
      expect(mockHttpClient.patch).toHaveBeenCalledWith('http://localhost:5000/jobs/1/pause')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Job Paused',
        description: 'Job posting has been paused.'
      })
    })
  })

  test('handles activate job action', async () => {
    const user = userEvent.setup()
    mockHttpClient.patch.mockResolvedValue({ data: { success: true } })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    })

    // Frontend Developer is paused, so should have Activate button
    const activateButton = screen.getByRole('button', { name: 'Activate' })
    await user.click(activateButton)
    
    await waitFor(() => {
      expect(mockHttpClient.patch).toHaveBeenCalledWith('http://localhost:5000/jobs/3/activate')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Job Activated',
        description: 'Job posting is now active.'
      })
    })
  })

  test('handles delete job action with confirmation', async () => {
    const user = userEvent.setup()
    mockHttpClient.delete.mockResolvedValue({ data: { success: true } })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])
    
    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this job posting? This action cannot be undone.'
      )
      expect(mockHttpClient.delete).toHaveBeenCalledWith('http://localhost:5000/jobs/1')
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Job Deleted',
        description: 'Job posting has been deleted.'
      })
    })
  })

  test('handles copy job link', async () => {
    const user = userEvent.setup()
    const mockWriteText = jest.fn()
    Object.assign(navigator, {
      clipboard: { writeText: mockWriteText }
    })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const copyButtons = screen.getAllByRole('button', { name: 'Copy Link' })
    await user.click(copyButtons[0])
    
    expect(mockWriteText).toHaveBeenCalledWith(`${window.location.origin}/jobs/1`)
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Link Copied',
      description: 'Job posting link copied to clipboard.'
    })
  })

  test('handles bulk actions with selected jobs', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockResolvedValue({ data: { success: true } })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    // Select first two jobs
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    
    expect(screen.getByText('2 jobs selected')).toBeInTheDocument()
    
    // Click bulk pause
    const bulkPauseButton = screen.getByRole('button', { name: 'Pause' })
    await user.click(bulkPauseButton)
    
    await waitFor(() => {
      expect(mockHttpClient.post).toHaveBeenCalledWith('http://localhost:5000/jobs/bulk-pause', {
        jobIds: ['1', '2']
      })
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Bulk Action Completed',
        description: 'pause applied to 2 jobs.'
      })
    })
  })

  test('shows error for bulk action without selected jobs', async () => {
    const user = userEvent.setup()
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    // Try bulk action without selecting jobs - should not show bulk actions
    expect(screen.queryByText('jobs selected')).not.toBeInTheDocument()
  })

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup()
    mockHttpClient.patch.mockRejectedValue({
      response: { data: { message: 'Server error' } }
    })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const pauseButton = screen.getByRole('button', { name: 'Pause' })
    await user.click(pauseButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Action Failed',
        description: 'Server error',
        variant: 'destructive'
      })
    })
  })

  test('handles refresh button', async () => {
    const user = userEvent.setup()
    const reloadMock = jest.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true
    })
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Job Management')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: '' }) // Refresh icon button
    await user.click(refreshButton)
    
    expect(reloadMock).toHaveBeenCalled()
  })

  test('displays empty state when no jobs match filters', async () => {
    const user = userEvent.setup()
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    // Search for non-existent job
    const searchInput = screen.getByPlaceholderText('Search jobs by title, department, or location...')
    await user.type(searchInput, 'NonexistentJob')
    
    expect(screen.getByText('No matching jobs found')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument()
  })

  test('displays featured badge for featured jobs', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Featured')).toBeInTheDocument()
    })
  })

  test('calculates and displays performance metrics correctly', async () => {
    renderJobManagementPage()
    
    await waitFor(() => {
      // Check conversion rate calculation
      expect(screen.getByText('3.8%')).toBeInTheDocument() // 47/1234 * 100 = 3.8%
      expect(screen.getByText('4.1%')).toBeInTheDocument() // 23/567 * 100 = 4.1%
    })
  })

  test('handles delete action cancellation', async () => {
    const user = userEvent.setup()
    ;(window.confirm as jest.Mock).mockReturnValue(false)
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])
    
    expect(window.confirm).toHaveBeenCalled()
    expect(mockHttpClient.delete).not.toHaveBeenCalled()
  })

  test('handles bulk action API errors', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockRejectedValue(new Error('Network error'))
    
    renderJobManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    })

    // Select a job and try bulk action
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    
    const bulkPauseButton = screen.getByRole('button', { name: 'Pause' })
    await user.click(bulkPauseButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Bulk Action Failed',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive'
      })
    })
  })
})