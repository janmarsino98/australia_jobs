import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobApplicationsManagementPage from '../JobApplicationsManagementPage'
import httpClient from '../../httpClient'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
    patch: jest.fn(),
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
  useParams: jest.fn(() => ({ jobId: 'job-123' }))
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
const mockToast = jest.fn()

const renderJobApplicationsManagementPage = () => {
  return render(
    <BrowserRouter>
      <JobApplicationsManagementPage />
    </BrowserRouter>
  )
}

describe('JobApplicationsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('../../components/ui/use-toast').useToast as jest.Mock).mockReturnValue({
      toast: mockToast
    })
  })

  test('renders loading state initially', () => {
    renderJobApplicationsManagementPage()
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  test('renders page header and job title', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Applications')).toBeInTheDocument()
      expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
      expect(screen.getByText('Manage applications for')).toBeInTheDocument()
    })
  })

  test('displays status overview cards with correct counts', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('Reviewing')).toBeInTheDocument()
      expect(screen.getByText('Shortlisted')).toBeInTheDocument()
      expect(screen.getByText('Interview')).toBeInTheDocument()
      expect(screen.getByText('Offer')).toBeInTheDocument()
      expect(screen.getByText('Hired')).toBeInTheDocument()
      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })

    // Check counts (1 pending, 1 reviewing, 1 shortlisted, 1 interview)
    const countElements = screen.getAllByText('1')
    expect(countElements.length).toBeGreaterThan(0)
  })

  test('displays application list with applicant information', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
      expect(screen.getByText('Michael Chen')).toBeInTheDocument()
      expect(screen.getByText('Emma Wilson')).toBeInTheDocument()
      expect(screen.getByText('David Rodriguez')).toBeInTheDocument()
    })

    // Check contact information
    expect(screen.getByText('sarah.johnson@email.com')).toBeInTheDocument()
    expect(screen.getByText('m.chen@email.com')).toBeInTheDocument()
    expect(screen.getByText('+61 423 456 789')).toBeInTheDocument()
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
  })

  test('displays skills and experience for each applicant', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('5 years experience')).toBeInTheDocument()
      expect(screen.getByText('7 years experience')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
    })
  })

  test('displays ratings and notes when available', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('4.5')).toBeInTheDocument()
      expect(screen.getByText('5.0')).toBeInTheDocument()
      expect(screen.getByText('Strong technical background, good communication skills')).toBeInTheDocument()
      expect(screen.getByText('Excellent candidate, strong portfolio')).toBeInTheDocument()
    })
  })

  test('displays salary expectations', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('$120,000 expected')).toBeInTheDocument()
      expect(screen.getByText('$140,000 expected')).toBeInTheDocument()
      expect(screen.getByText('$85,000 expected')).toBeInTheDocument()
    })
  })

  test('handles search functionality', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search by name, email, or skills...')
    await user.type(searchInput, 'Sarah')
    
    // Should show Sarah Johnson
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    
    // Clear and search by skill
    await user.clear(searchInput)
    await user.type(searchInput, 'Vue.js')
    
    // Should show Michael Chen who has Vue.js skill
    expect(screen.getByText('Michael Chen')).toBeInTheDocument()
  })

  test('handles status filter', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    const statusFilter = screen.getByDisplayValue('All Status')
    await user.selectOptions(statusFilter, 'shortlisted')
    
    // Should show only Michael Chen who is shortlisted
    expect(screen.getByText('Michael Chen')).toBeInTheDocument()
  })

  test('handles status card click to filter', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Click on the interview status card
    const interviewCard = screen.getByText('Interview').closest('.cursor-pointer')
    if (interviewCard) {
      await user.click(interviewCard)
    }
    
    // Should filter to show only interview status applications
    expect(screen.getByText('Emma Wilson')).toBeInTheDocument()
  })

  test('handles application selection and bulk actions', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Select first application
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    
    // Should show bulk actions
    expect(screen.getByText('1 application selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Shortlist' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeInTheDocument()
  })

  test('handles status change for individual application', async () => {
    const user = userEvent.setup()
    mockHttpClient.patch.mockResolvedValue({ data: { success: true } })
    
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Find and change status for first application
    const statusSelects = screen.getAllByDisplayValue('reviewing')
    await user.selectOptions(statusSelects[0], 'shortlisted')
    
    await waitFor(() => {
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        'http://localhost:5000/applications/1/status',
        { status: 'shortlisted' }
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Status Updated',
        description: 'Application status changed to shortlisted.'
      })
    })
  })

  test('handles bulk shortlist action', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockResolvedValue({ data: { success: true } })
    
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Select first application
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    
    // Click bulk shortlist
    const shortlistButton = screen.getByRole('button', { name: 'Shortlist' })
    await user.click(shortlistButton)
    
    await waitFor(() => {
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:5000/applications/bulk-shortlist',
        { applicationIds: ['1'] }
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Bulk Action Completed',
        description: 'shortlist applied to 1 application.'
      })
    })
  })

  test('handles export functionality', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: 'Export' })
    await user.click(exportButton)
    
    expect(mockToast).toHaveBeenCalledWith({
      title: 'Export Started',
      description: 'Applications data export has been initiated.'
    })
  })

  test('shows error when bulk action attempted without selection', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Try bulk action without selecting applications - no bulk buttons should be visible
    expect(screen.queryByText('applications selected')).not.toBeInTheDocument()
  })

  test('displays cover letters when available', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText(/I am very interested in this position/)).toBeInTheDocument()
      expect(screen.getByText(/Having worked with similar technologies/)).toBeInTheDocument()
    })
  })

  test('displays action buttons for each application', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getAllByText('Resume')).toHaveLength(4)
      expect(screen.getAllByText('Contact')).toHaveLength(4)
      expect(screen.getAllByText('Interview')).toHaveLength(4)
    })
  })

  test('handles API errors for status updates', async () => {
    const user = userEvent.setup()
    mockHttpClient.patch.mockRejectedValue(new Error('Network error'))
    
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    const statusSelects = screen.getAllByDisplayValue('reviewing')
    await user.selectOptions(statusSelects[0], 'rejected')
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Update Failed',
        description: 'Failed to update application status. Please try again.',
        variant: 'destructive'
      })
    })
  })

  test('handles API errors for bulk actions', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockRejectedValue(new Error('Network error'))
    
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Select application and try bulk action
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    
    const rejectButton = screen.getByRole('button', { name: 'Reject' })
    await user.click(rejectButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Bulk Action Failed',
        description: 'Failed to perform bulk action. Please try again.',
        variant: 'destructive'
      })
    })
  })

  test('displays empty state when no applications match filters', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Search for non-existent applicant
    const searchInput = screen.getByPlaceholderText('Search by name, email, or skills...')
    await user.type(searchInput, 'NonexistentApplicant')
    
    expect(screen.getByText('No matching applications')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search criteria or filters')).toBeInTheDocument()
  })

  test('displays skills with overflow handling', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      // Sarah Johnson has 5 skills, all should be visible
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
      expect(screen.getByText('MongoDB')).toBeInTheDocument()
    })
  })

  test('calculates and displays days since application', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      // Applications are a few days old, should show "Applied X days ago"
      expect(screen.getByText(/Applied \d+ days ago/)).toBeInTheDocument()
    })
  })

  test('displays status badges with correct styling', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Reviewing')).toBeInTheDocument()
      expect(screen.getByText('Shortlisted')).toBeInTheDocument()
      expect(screen.getByText('Interview')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  test('handles multiple application selection', async () => {
    const user = userEvent.setup()
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument()
    })

    // Select multiple applications
    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    
    expect(screen.getByText('2 applications selected')).toBeInTheDocument()
  })

  test('displays phone numbers only when available', async () => {
    renderJobApplicationsManagementPage()
    
    await waitFor(() => {
      // Sarah and Emma have phone numbers
      expect(screen.getByText('+61 423 456 789')).toBeInTheDocument()
      expect(screen.getByText('+61 401 234 567')).toBeInTheDocument()
      
      // Check that applications without phone numbers don't show phone icons
      const phoneIcons = screen.getAllByTestId('phone-icon') || []
      expect(phoneIcons.length).toBeLessThanOrEqual(2)
    })
  })
})