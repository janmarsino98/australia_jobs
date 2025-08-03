import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobDetailsPage from '../JobDetailsPage'
import httpClient from '../../httpClient'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(() => ({ id: 'job-123' })),
  useNavigate: jest.fn()
}))

jest.mock('../../components/molecules/NoResumeAlert', () => {
  return function NoResumeAlert() {
    return <div data-testid="no-resume-alert">No Resume Alert</div>
  }
})

jest.mock('../../components/molecules/JobApplicationModal', () => {
  return function JobApplicationModal({ isOpen, onClose, job }: any) {
    return isOpen ? (
      <div data-testid="job-application-modal">
        <span>Modal for {job.title}</span>
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  }
})

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>
const mockNavigate = jest.fn()

const mockJobData = {
  _id: 'job-123',
  title: 'Senior Frontend Developer',
  firm: 'Tech Solutions Inc',
  location: 'Sydney, NSW',
  jobtype: 'Full-time',
  remuneration_amount: '$120,000',
  remuneration_period: 'year',
  posted: '2 days ago',
  description: {
    introduction: 'We are looking for a talented Senior Frontend Developer to join our team.',
    requirements: ['5+ years React experience', 'TypeScript proficiency', 'Team leadership skills'],
    responsibilities: ['Lead frontend development', 'Mentor junior developers', 'Code reviews'],
    benefits: ['Health insurance', 'Flexible working hours', '401k matching'],
    closingStatement: 'Join our innovative team and make an impact!'
  },
  company_logo: 'https://example.com/logo.png',
  company_description: 'Tech Solutions Inc is a leading technology company.',
  skills_required: ['React', 'TypeScript', 'Node.js', 'AWS'],
  experience_level: 'Senior',
  employment_type: 'Permanent',
  application_deadline: '2024-02-15'
}

const renderJobDetailsPage = () => {
  return render(
    <BrowserRouter>
      <JobDetailsPage />
    </BrowserRouter>
  )
}

// Mock navigator.share and navigator.clipboard
Object.assign(navigator, {
  share: jest.fn(),
  clipboard: {
    writeText: jest.fn()
  }
})

describe('JobDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    mockHttpClient.get.mockResolvedValue({ data: mockJobData })
  })

  test('renders loading state initially', () => {
    // Mock pending API call
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockHttpClient.get.mockReturnValue(pendingPromise as any)
    
    renderJobDetailsPage()
    
    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    
    // Resolve the promise
    resolvePromise({ data: mockJobData })
  })

  test('fetches and displays job data correctly', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith('/jobs/job-123')
    })
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
      expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument()
      expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
      expect(screen.getByText('Full-time')).toBeInTheDocument()
    })
  })

  test('displays job description sections', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Job Description')).toBeInTheDocument()
      expect(screen.getByText('We are looking for a talented Senior Frontend Developer to join our team.')).toBeInTheDocument()
      
      // Requirements section
      expect(screen.getByText('Requirements')).toBeInTheDocument()
      expect(screen.getByText('5+ years React experience')).toBeInTheDocument()
      
      // Responsibilities section
      expect(screen.getByText('Responsibilities')).toBeInTheDocument()
      expect(screen.getByText('Lead frontend development')).toBeInTheDocument()
      
      // Benefits section
      expect(screen.getByText('Benefits')).toBeInTheDocument()
      expect(screen.getByText('Health insurance')).toBeInTheDocument()
      
      // Closing statement
      expect(screen.getByText('Join our innovative team and make an impact!')).toBeInTheDocument()
    })
  })

  test('displays required skills section', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Required Skills')).toBeInTheDocument()
      expect(screen.getByText('React')).toBeInTheDocument()
      expect(screen.getByText('TypeScript')).toBeInTheDocument()
      expect(screen.getByText('Node.js')).toBeInTheDocument()
      expect(screen.getByText('AWS')).toBeInTheDocument()
    })
  })

  test('displays company information in sidebar', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('About Tech Solutions Inc')).toBeInTheDocument()
      expect(screen.getByText('Tech Solutions Inc is a leading technology company.')).toBeInTheDocument()
    })
  })

  test('handles back button click', async () => {
    const user = userEvent.setup()
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)
    
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test('handles apply button clicks', async () => {
    const user = userEvent.setup()
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    // Click main apply button
    const applyButtons = screen.getAllByText(/apply/i)
    await user.click(applyButtons[0])
    
    await waitFor(() => {
      expect(screen.getByTestId('job-application-modal')).toBeInTheDocument()
      expect(screen.getByText('Modal for Senior Frontend Developer')).toBeInTheDocument()
    })
  })

  test('handles save job functionality', async () => {
    const user = userEvent.setup()
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toHaveTextContent('Save')
    
    await user.click(saveButton)
    
    expect(saveButton).toHaveTextContent('Saved')
    
    // Click again to unsave
    await user.click(saveButton)
    expect(saveButton).toHaveTextContent('Save')
  })

  test('handles share functionality with native share API', async () => {
    const user = userEvent.setup()
    const mockShare = jest.fn()
    Object.assign(navigator, { share: mockShare })
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    const shareButton = screen.getByRole('button', { name: /share/i })
    await user.click(shareButton)
    
    expect(mockShare).toHaveBeenCalledWith({
      title: 'Senior Frontend Developer',
      text: 'Check out this job opportunity at Tech Solutions Inc',
      url: window.location.href
    })
  })

  test('handles share functionality fallback to clipboard', async () => {
    const user = userEvent.setup()
    const mockWriteText = jest.fn()
    Object.assign(navigator, { 
      share: undefined,
      clipboard: { writeText: mockWriteText }
    })
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    const shareButton = screen.getByRole('button', { name: /share/i })
    await user.click(shareButton)
    
    expect(mockWriteText).toHaveBeenCalledWith(window.location.href)
  })

  test('displays job not found state', async () => {
    mockHttpClient.get.mockRejectedValue(new Error('Job not found'))
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Job Not Found')).toBeInTheDocument()
      expect(screen.getByText('The job you\'re looking for doesn\'t exist or has been removed.')).toBeInTheDocument()
    })
    
    const backButton = screen.getByRole('button', { name: /back to jobs/i })
    expect(backButton).toBeInTheDocument()
  })

  test('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockHttpClient.get.mockRejectedValue(new Error('API Error'))
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error while trying to fetch job: ', expect.any(Error))
    })
    
    consoleSpy.mockRestore()
  })

  test('displays company logo when available', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      const logo = screen.getByAltText('Tech Solutions Inc logo')
      expect(logo).toBeInTheDocument()
      expect(logo).toHaveAttribute('src', 'https://example.com/logo.png')
    })
  })

  test('displays badges with correct information', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('$120,000 / year')).toBeInTheDocument()
      expect(screen.getByText('Posted 2 days ago')).toBeInTheDocument()
      expect(screen.getByText('Senior')).toBeInTheDocument()
      expect(screen.getByText('Permanent')).toBeInTheDocument()
    })
  })

  test('displays application deadline when available', async () => {
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Application deadline: 2024-02-15')).toBeInTheDocument()
    })
  })

  test('closes application modal when close button clicked', async () => {
    const user = userEvent.setup()
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    // Open modal
    const applyButton = screen.getAllByText(/apply/i)[0]
    await user.click(applyButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('job-application-modal')).toBeInTheDocument()
    })
    
    // Close modal
    const closeButton = screen.getByText('Close Modal')
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByTestId('job-application-modal')).not.toBeInTheDocument()
    })
  })

  test('renders without skills section when skills not provided', async () => {
    const jobWithoutSkills = { ...mockJobData, skills_required: undefined }
    mockHttpClient.get.mockResolvedValue({ data: jobWithoutSkills })
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    expect(screen.queryByText('Required Skills')).not.toBeInTheDocument()
  })

  test('handles missing optional fields gracefully', async () => {
    const minimalJob = {
      ...mockJobData,
      company_logo: undefined,
      company_description: undefined,
      experience_level: undefined,
      employment_type: undefined,
      application_deadline: undefined
    }
    mockHttpClient.get.mockResolvedValue({ data: minimalJob })
    
    renderJobDetailsPage()
    
    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    })
    
    // Should still render with fallback company description
    expect(screen.getByText('Tech Solutions Inc is a leading company in their industry, committed to innovation and excellence.')).toBeInTheDocument()
  })
})