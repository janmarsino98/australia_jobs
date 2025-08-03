import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import SavedJobsPage from '../SavedJobsPage'
import { SavedJob } from '../../stores/useSavedJobsStore'

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

const mockUseSavedJobsStore = {
  savedJobs: [
    {
      _id: '1',
      title: 'Senior React Developer',
      firm: 'TechCorp',
      location: 'Sydney, NSW',
      jobtype: 'Full-time',
      remuneration_amount: '$120,000',
      remuneration_period: 'year',
      description: 'We are looking for a talented React developer to join our team.',
      slug: 'senior-react-developer',
      savedAt: '2024-02-01T10:00:00Z',
      status: 'saved' as const,
      notes: 'Interesting company culture'
    },
    {
      _id: '2',
      title: 'Frontend Engineer',
      firm: 'StartupCo',
      location: 'Melbourne, VIC',
      jobtype: 'Contract',
      remuneration_amount: '$85,000',
      remuneration_period: 'year',
      slug: 'frontend-engineer',
      savedAt: '2024-02-02T14:30:00Z',
      status: 'applied' as const
    },
    {
      _id: '3',
      title: 'UI/UX Developer',
      firm: 'DesignHub',
      location: 'Brisbane, QLD',
      jobtype: 'Part-time',
      remuneration_amount: '$60,000',
      remuneration_period: 'year',
      slug: 'ui-ux-developer',
      savedAt: '2024-02-03T09:15:00Z',
      status: 'interview' as const,
      notes: 'Great design team'
    }
  ] as SavedJob[],
  filteredJobs: [] as SavedJob[],
  searchQuery: '',
  setSearchQuery: jest.fn(),
  removeJob: jest.fn(),
  updateJobStatus: jest.fn(),
  updateJobNotes: jest.fn(),
  exportSavedJobs: jest.fn(() => JSON.stringify([]))
}

jest.mock('../../stores/useSavedJobsStore', () => ({
  __esModule: true,
  default: () => mockUseSavedJobsStore
}))

jest.mock('../../components/molecules/JobApplicationModal', () => {
  return function JobApplicationModal({ isOpen, onClose, job }: any) {
    return isOpen ? (
      <div data-testid="job-application-modal">
        <span>Apply to {job.title}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  }
})

const mockNavigate = jest.fn()

// Mock window.confirm
Object.assign(window, {
  confirm: jest.fn(() => true)
})

// Mock URL and createElement for export functionality
Object.assign(window, {
  URL: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
})

const renderSavedJobsPage = () => {
  return render(
    <BrowserRouter>
      <SavedJobsPage />
    </BrowserRouter>
  )
}

describe('SavedJobsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    
    // Reset filteredJobs to match savedJobs by default
    mockUseSavedJobsStore.filteredJobs = [...mockUseSavedJobsStore.savedJobs]
  })

  test('renders page header with job count', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('Saved Jobs')).toBeInTheDocument()
    expect(screen.getByText('3 jobs saved')).toBeInTheDocument()
  })

  test('renders search input and filters', () => {
    renderSavedJobsPage()
    
    expect(screen.getByPlaceholderText('Search saved jobs...')).toBeInTheDocument()
    expect(screen.getByText('Filter by status')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  test('displays saved jobs list', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('UI/UX Developer')).toBeInTheDocument()
    
    expect(screen.getByText('TechCorp')).toBeInTheDocument()
    expect(screen.getByText('StartupCo')).toBeInTheDocument()
    expect(screen.getByText('DesignHub')).toBeInTheDocument()
  })

  test('displays job details correctly', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
    expect(screen.getByText('Melbourne, VIC')).toBeInTheDocument()
    expect(screen.getByText('$120,000/year')).toBeInTheDocument()
    expect(screen.getByText('Full-time')).toBeInTheDocument()
    expect(screen.getByText('Contract')).toBeInTheDocument()
  })

  test('displays status badges correctly', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('Saved')).toBeInTheDocument()
    expect(screen.getByText('Applied')).toBeInTheDocument()
    expect(screen.getByText('Interview')).toBeInTheDocument()
  })

  test('displays notes when available', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('Interesting company culture')).toBeInTheDocument()
    expect(screen.getByText('Great design team')).toBeInTheDocument()
    expect(screen.getByText('No notes added')).toBeInTheDocument()
  })

  test('handles search functionality', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    const searchInput = screen.getByPlaceholderText('Search saved jobs...')
    await user.type(searchInput, 'React')
    
    expect(mockUseSavedJobsStore.setSearchQuery).toHaveBeenCalledWith('React')
  })

  test('handles view job action', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    const viewButtons = screen.getAllByRole('button', { name: /view/i })
    await user.click(viewButtons[0])
    
    expect(mockNavigate).toHaveBeenCalledWith('/job-details/senior-react-developer')
  })

  test('handles remove job action with confirmation', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to remove this job from your saved list?'
    )
    expect(mockUseSavedJobsStore.removeJob).toHaveBeenCalledWith('1')
  })

  test('handles status change', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    // Find the first status selector and change it
    const statusSelectors = screen.getAllByDisplayValue('Saved')
    await user.click(statusSelectors[0])
    
    const appliedOption = screen.getByText('Applied')
    await user.click(appliedOption)
    
    expect(mockUseSavedJobsStore.updateJobStatus).toHaveBeenCalledWith('1', 'applied')
  })

  test('handles quick apply button', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    // Quick apply should be available for non-applied jobs
    const quickApplyButtons = screen.getAllByRole('button', { name: /quick apply/i })
    await user.click(quickApplyButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('job-application-modal')).toBeInTheDocument()
      expect(screen.getByText('Apply to Senior React Developer')).toBeInTheDocument()
    })
  })

  test('does not show quick apply for already applied jobs', () => {
    renderSavedJobsPage()
    
    // The Frontend Engineer job has status 'applied', so should not show Quick Apply
    const quickApplyButtons = screen.getAllByRole('button', { name: /quick apply/i })
    expect(quickApplyButtons.length).toBe(2) // Only for saved and interview status jobs
  })

  test('handles notes editing', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    // Click "Add Note" for a job without notes
    const addNoteButton = screen.getByRole('button', { name: /add note/i })
    await user.click(addNoteButton)
    
    // Should show textarea
    const textarea = screen.getByPlaceholderText('Add your notes about this job...')
    expect(textarea).toBeInTheDocument()
    
    // Type notes
    await user.type(textarea, 'This looks promising')
    
    // Save notes
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)
    
    expect(mockUseSavedJobsStore.updateJobNotes).toHaveBeenCalledWith('2', 'This looks promising')
  })

  test('handles notes editing cancellation', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    const addNoteButton = screen.getByRole('button', { name: /add note/i })
    await user.click(addNoteButton)
    
    const textarea = screen.getByPlaceholderText('Add your notes about this job...')
    await user.type(textarea, 'Some notes')
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    
    // Textarea should be gone
    expect(screen.queryByPlaceholderText('Add your notes about this job...')).not.toBeInTheDocument()
  })

  test('handles export functionality', async () => {
    const user = userEvent.setup()
    const mockAppendChild = jest.fn()
    const mockRemoveChild = jest.fn()
    const mockClick = jest.fn()
    
    // Mock document methods and createElement
    Object.assign(document, {
      createElement: jest.fn(() => ({
        href: '',
        download: '',
        click: mockClick
      })),
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild
      }
    })
    
    renderSavedJobsPage()
    
    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)
    
    expect(mockUseSavedJobsStore.exportSavedJobs).toHaveBeenCalled()
    expect(mockClick).toHaveBeenCalled()
  })

  test('shows empty state when no saved jobs', () => {
    mockUseSavedJobsStore.savedJobs = []
    mockUseSavedJobsStore.filteredJobs = []
    
    renderSavedJobsPage()
    
    expect(screen.getByText('No saved jobs yet')).toBeInTheDocument()
    expect(screen.getByText('Start browsing jobs and save the ones that interest you!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /browse jobs/i })).toBeInTheDocument()
  })

  test('shows empty state when no jobs match filters', () => {
    mockUseSavedJobsStore.filteredJobs = [] // Empty filtered but savedJobs has items
    
    renderSavedJobsPage()
    
    expect(screen.getByText('No jobs match your filters')).toBeInTheDocument()
    expect(screen.getByText('Try adjusting your search or filter criteria.')).toBeInTheDocument()
  })

  test('navigates to browse jobs from empty state', async () => {
    const user = userEvent.setup()
    mockUseSavedJobsStore.savedJobs = []
    mockUseSavedJobsStore.filteredJobs = []
    
    renderSavedJobsPage()
    
    const browseJobsButton = screen.getByRole('button', { name: /browse jobs/i })
    await user.click(browseJobsButton)
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs')
  })

  test('closes application modal', async () => {
    const user = userEvent.setup()
    renderSavedJobsPage()
    
    const quickApplyButtons = screen.getAllByRole('button', { name: /quick apply/i })
    await user.click(quickApplyButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('job-application-modal')).toBeInTheDocument()
    })
    
    const closeButton = screen.getByText('Close Modal')
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('job-application-modal')).not.toBeInTheDocument()
    })
  })

  test('formats salary correctly', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('$120,000/year')).toBeInTheDocument()
    expect(screen.getByText('$85,000/year')).toBeInTheDocument()
  })

  test('handles salary without period', () => {
    mockUseSavedJobsStore.savedJobs[0].remuneration_period = undefined
    mockUseSavedJobsStore.filteredJobs = [...mockUseSavedJobsStore.savedJobs]
    
    renderSavedJobsPage()
    
    expect(screen.getByText('$120,000')).toBeInTheDocument()
  })

  test('handles missing salary information', () => {
    mockUseSavedJobsStore.savedJobs[0].remuneration_amount = undefined
    mockUseSavedJobsStore.filteredJobs = [...mockUseSavedJobsStore.savedJobs]
    
    renderSavedJobsPage()
    
    expect(screen.getByText('Salary not specified')).toBeInTheDocument()
  })

  test('displays saved date correctly', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText(/Saved \d{1,2}\/\d{1,2}\/\d{4}/)).toBeInTheDocument()
  })

  test('handles remove job cancellation', async () => {
    const user = userEvent.setup()
    ;(window.confirm as jest.Mock).mockReturnValue(false)
    
    renderSavedJobsPage()
    
    const removeButtons = screen.getAllByRole('button', { name: /remove/i })
    await user.click(removeButtons[0])
    
    expect(window.confirm).toHaveBeenCalled()
    expect(mockUseSavedJobsStore.removeJob).not.toHaveBeenCalled()
  })

  test('shows correct status colors', () => {
    renderSavedJobsPage()
    
    const savedBadge = screen.getByText('Saved')
    const appliedBadge = screen.getByText('Applied')
    const interviewBadge = screen.getByText('Interview')
    
    expect(savedBadge).toHaveClass('bg-gray-100', 'text-gray-800')
    expect(appliedBadge).toHaveClass('bg-blue-100', 'text-blue-800')
    expect(interviewBadge).toHaveClass('bg-green-100', 'text-green-800')
  })

  test('handles job with description', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('We are looking for a talented React developer to join our team.')).toBeInTheDocument()
  })

  test('handles job without description', () => {
    mockUseSavedJobsStore.savedJobs[1].description = undefined
    mockUseSavedJobsStore.filteredJobs = [...mockUseSavedJobsStore.savedJobs]
    
    renderSavedJobsPage()
    
    // Should not crash and should still show the job card
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
  })

  test('updates job count when savedJobs array changes', () => {
    renderSavedJobsPage()
    
    expect(screen.getByText('3 jobs saved')).toBeInTheDocument()
    
    // Simulate removing a job
    mockUseSavedJobsStore.savedJobs = mockUseSavedJobsStore.savedJobs.slice(0, 2)
    
    renderSavedJobsPage()
    
    expect(screen.getByText('2 jobs saved')).toBeInTheDocument()
  })

  test('handles singular job count', () => {
    mockUseSavedJobsStore.savedJobs = [mockUseSavedJobsStore.savedJobs[0]]
    mockUseSavedJobsStore.filteredJobs = [...mockUseSavedJobsStore.savedJobs]
    
    renderSavedJobsPage()
    
    expect(screen.getByText('1 job saved')).toBeInTheDocument()
  })
})