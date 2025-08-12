import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import JobApplicationKanban from '../JobApplicationKanban'
import { JobApplication } from '../../../stores/useJobApplicationStore'

// Mock the store
const mockApplications: JobApplication[] = [
  {
    id: '1',
    jobTitle: 'Senior Developer',
    company: 'Tech Corp',
    location: 'Sydney, NSW',
    appliedDate: Date.now() - 86400000, // 1 day ago
    status: 'applied',
    jobUrl: 'https://example.com/job1',
    notes: 'Great company culture',
    salary: { min: 90000, max: 120000, currency: 'AUD' }
  },
  {
    id: '2',
    jobTitle: 'Frontend Engineer',
    company: 'StartupCo',
    location: 'Melbourne, VIC',
    appliedDate: Date.now() - 172800000, // 2 days ago
    status: 'reviewing',
    jobUrl: 'https://example.com/job2',
    interviewDate: Date.now() + 604800000 // 1 week from now
  },
  {
    id: '3',
    jobTitle: 'React Developer',
    company: 'WebDev Inc',
    location: 'Brisbane, QLD',
    appliedDate: Date.now() - 259200000, // 3 days ago
    status: 'interview',
    jobUrl: 'https://example.com/job3',
    followUpDate: Date.now() + 86400000, // 1 day from now
    notes: 'Technical interview scheduled for next week. Need to review React hooks and state management patterns.'
  },
  {
    id: '4',
    jobTitle: 'Full Stack Developer',
    company: 'BigCorp',
    location: 'Perth, WA',
    appliedDate: Date.now() - 604800000, // 1 week ago
    status: 'offer',
    salary: { min: 110000, max: 130000, currency: 'AUD' }
  },
  {
    id: '5',
    jobTitle: 'Junior Developer',
    company: 'SmallTech',
    location: 'Adelaide, SA',
    appliedDate: Date.now() - 1209600000, // 2 weeks ago
    status: 'rejected'
  }
]

const mockStore = {
  applications: mockApplications,
  getApplicationsByStatus: jest.fn(),
  updateApplicationStatus: jest.fn(),
  removeApplication: jest.fn(),
  getApplicationStats: jest.fn()
}

jest.mock('../../../stores/useJobApplicationStore', () => ({
  __esModule: true,
  default: () => mockStore
}))

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <JobApplicationKanban {...props} />
    </BrowserRouter>
  )
}

describe('JobApplicationKanban', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Setup default mock implementations
    mockStore.getApplicationsByStatus.mockImplementation((status) => 
      mockApplications.filter(app => app.status === status)
    )
    
    mockStore.getApplicationStats.mockReturnValue({
      applied: 1,
      reviewing: 1,
      interview: 1,
      offer: 1,
      rejected: 1,
      withdrawn: 0,
      total: 5,
      successRate: 20
    })
  })

  test('renders kanban board with title and add button', () => {
    renderComponent()

    expect(screen.getByText('Application Pipeline')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Application' })).toBeInTheDocument()
  })

  test('displays all kanban columns with correct counts', () => {
    renderComponent()

    const columns = [
      { title: 'Applied', count: '1' },
      { title: 'Under Review', count: '1' },
      { title: 'Interview', count: '1' },
      { title: 'Offer', count: '1' },
      { title: 'Rejected', count: '1' },
      { title: 'Withdrawn', count: '0' }
    ]

    columns.forEach(({ title, count }) => {
      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText(count)).toBeInTheDocument()
    })
  })

  test('renders applications in correct columns', () => {
    renderComponent()

    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('React Developer')).toBeInTheDocument()
    expect(screen.getByText('Full Stack Developer')).toBeInTheDocument()
    expect(screen.getByText('Junior Developer')).toBeInTheDocument()
  })

  test('displays empty state when no applications', () => {
    mockStore.applications = []
    mockStore.getApplicationsByStatus.mockReturnValue([])
    mockStore.getApplicationStats.mockReturnValue({
      applied: 0,
      reviewing: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
      withdrawn: 0,
      total: 0,
      successRate: 0
    })

    renderComponent()

    expect(screen.getByText('No applications yet')).toBeInTheDocument()
    expect(screen.getByText('Start tracking your job applications to see them here')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Your First Application' })).toBeInTheDocument()
  })

  test('handles add application button click', async () => {
    const mockOnAddApplication = jest.fn()
    const user = userEvent.setup()
    
    renderComponent({ onAddApplication: mockOnAddApplication })

    const addButton = screen.getByRole('button', { name: 'Add Application' })
    await user.click(addButton)

    expect(mockOnAddApplication).toHaveBeenCalledTimes(1)
  })

  test('displays application details correctly', () => {
    renderComponent()

    // Check job details
    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
    
    // Check salary formatting
    expect(screen.getByText('$90,000-$120,000 AUD')).toBeInTheDocument()
    
    // Check notes truncation
    expect(screen.getByText('Great company culture')).toBeInTheDocument()
  })

  test('truncates long notes correctly', () => {
    renderComponent()

    const longNote = screen.getByText((content, element) => {
      return element?.textContent?.includes('Technical interview scheduled for next week') === true
    })
    
    expect(longNote).toBeInTheDocument()
    expect(longNote?.textContent).toMatch(/\.\.\./)
  })

  test('displays badges for interview and follow-up dates', () => {
    renderComponent()

    expect(screen.getByText('Interview scheduled')).toBeInTheDocument()
    expect(screen.getByText('Follow-up due')).toBeInTheDocument()
  })

  test('handles drag and drop functionality', async () => {
    renderComponent()

    const applicationCard = screen.getByText('Senior Developer').closest('div')
    expect(applicationCard).toHaveAttribute('draggable', 'true')

    // Simulate drag start
    fireEvent.dragStart(applicationCard!, { dataTransfer: { effectAllowed: 'move' } })

    // Find a different column and simulate drop
    const reviewingColumn = screen.getByText('Under Review').closest('div')
    fireEvent.dragOver(reviewingColumn!, { dataTransfer: { dropEffect: 'move' } })
    fireEvent.drop(reviewingColumn!, { dataTransfer: {} })

    expect(mockStore.updateApplicationStatus).toHaveBeenCalledWith('1', 'reviewing')
  })

  test('opens status menu on more options click', async () => {
    const user = userEvent.setup()
    renderComponent()

    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-400')
    )

    if (moreButton) {
      await user.click(moreButton)
      expect(screen.getByText('Move to')).toBeInTheDocument()
    }
  })

  test('changes application status via menu', async () => {
    const user = userEvent.setup()
    renderComponent()

    // Find and click more options button for first application
    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-400')
    )

    if (moreButton) {
      await user.click(moreButton)
      
      // Click on "Interview" option in menu
      const interviewOption = screen.getByText('Interview')
      await user.click(interviewOption)
      
      expect(mockStore.updateApplicationStatus).toHaveBeenCalledWith('1', 'interview')
    }
  })

  test('deletes application via menu', async () => {
    const user = userEvent.setup()
    renderComponent()

    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-400')
    )

    if (moreButton) {
      await user.click(moreButton)
      
      const deleteButton = screen.getByText('Delete')
      await user.click(deleteButton)
      
      expect(mockStore.removeApplication).toHaveBeenCalledWith('1')
    }
  })

  test('formats dates correctly', () => {
    renderComponent()

    // Should display "Applied" with formatted date
    expect(screen.getByText(/Applied \d+ [A-Za-z]+/)).toBeInTheDocument()
  })

  test('handles applications without salary', () => {
    renderComponent()

    // Some applications don't have salary - should still render
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('StartupCo')).toBeInTheDocument()
  })

  test('handles external job links', () => {
    renderComponent()

    const externalLinks = screen.getAllByRole('link')
    const jobLink = externalLinks.find(link => 
      link.getAttribute('href') === 'https://example.com/job1'
    )

    expect(jobLink).toBeInTheDocument()
    expect(jobLink).toHaveAttribute('target', '_blank')
    expect(jobLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('applies custom className', () => {
    renderComponent({ className: 'custom-kanban-class' })

    const card = screen.getByText('Application Pipeline').closest('div')
    expect(card).toHaveClass('custom-kanban-class')
  })

  test('handles applications without notes', () => {
    renderComponent()

    // Some applications don't have notes - should still render properly
    const appWithoutNotes = screen.getByText('Junior Developer')
    expect(appWithoutNotes).toBeInTheDocument()
  })

  test('shows correct status colors for different application statuses', () => {
    renderComponent()

    const statusIcons = screen.getAllByRole('generic').filter(element => 
      element.className.includes('text-blue-600') ||
      element.className.includes('text-yellow-600') ||
      element.className.includes('text-purple-600') ||
      element.className.includes('text-green-600') ||
      element.className.includes('text-red-600')
    )

    expect(statusIcons.length).toBeGreaterThan(0)
  })

  test('handles column drag over and drop events', () => {
    renderComponent()

    const appliedColumn = screen.getByText('Applied').closest('div')
    
    // Test drag over
    fireEvent.dragOver(appliedColumn!, { dataTransfer: { dropEffect: 'move' } })
    
    // Test drop without dragged item
    fireEvent.drop(appliedColumn!, { dataTransfer: {} })
    
    // Should not update status if no dragged item
    expect(mockStore.updateApplicationStatus).not.toHaveBeenCalled()
  })

  test('closes menu when clicking status change option', async () => {
    const user = userEvent.setup()
    renderComponent()

    const moreButtons = screen.getAllByRole('button')
    const moreButton = moreButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-400')
    )

    if (moreButton) {
      await user.click(moreButton)
      
      const offerOption = screen.getByText('Offer')
      await user.click(offerOption)
      
      // Menu should close after status change
      await waitFor(() => {
        expect(screen.queryByText('Move to')).not.toBeInTheDocument()
      })
    }
  })

  test('displays correct column background colors', () => {
    renderComponent()

    const appliedColumn = screen.getByText('Applied').closest('div')
    const reviewingColumn = screen.getByText('Under Review').closest('div')
    const interviewColumn = screen.getByText('Interview').closest('div')

    expect(appliedColumn).toHaveClass('bg-blue-50', 'border-blue-200')
    expect(reviewingColumn).toHaveClass('bg-yellow-50', 'border-yellow-200')
    expect(interviewColumn).toHaveClass('bg-purple-50', 'border-purple-200')
  })

  test('renders with scroll functionality for long application lists', () => {
    // Add many applications to a single status
    const manyApplications = Array.from({ length: 20 }, (_, i) => ({
      id: `many-${i}`,
      jobTitle: `Job ${i}`,
      company: `Company ${i}`,
      location: 'Sydney, NSW',
      appliedDate: Date.now(),
      status: 'applied' as const
    }))

    mockStore.getApplicationsByStatus.mockImplementation((status) => 
      status === 'applied' ? manyApplications : []
    )

    renderComponent()

    const applicationsList = screen.getByText('Job 0').closest('div')?.parentElement
    expect(applicationsList).toHaveClass('max-h-96', 'overflow-y-auto')
  })

  test('handles edge case with missing job URL', () => {
    const appWithoutUrl = {
      ...mockApplications[0],
      jobUrl: undefined
    }

    mockStore.getApplicationsByStatus.mockImplementation((status) => 
      status === 'applied' ? [appWithoutUrl] : []
    )

    renderComponent()

    expect(screen.getByText('Senior Developer')).toBeInTheDocument()
    // Should not have external link if no URL
    const externalLinks = screen.getAllByRole('link')
    expect(externalLinks).toHaveLength(0)
  })

  test('maintains drag state correctly', () => {
    renderComponent()

    const applicationCard = screen.getByText('Senior Developer').closest('div')
    
    // Start drag
    fireEvent.dragStart(applicationCard!, { 
      dataTransfer: { effectAllowed: 'move' }
    })

    // Should set dragged item
    expect(applicationCard).toHaveAttribute('draggable', 'true')

    // End drag by dropping elsewhere
    const offerColumn = screen.getByText('Offer').closest('div')
    fireEvent.drop(offerColumn!, { dataTransfer: {} })

    expect(mockStore.updateApplicationStatus).toHaveBeenCalledWith('1', 'offer')
  })
})