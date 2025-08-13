import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobPostingPage from '../JobPostingPage'
import httpClient from '../../httpClient'

// Mock dependencies
jest.mock('../../httpClient', () => ({
  __esModule: true,
  default: {
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
      _id: 'user-123',
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

jest.mock('../../components/molecules/FormInput', () => {
  return function FormInput({ label, value, onChange, error, placeholder, inputType = 'text', Icon }: any) {
    return (
      <div>
        <label>{label}</label>
        <input
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          data-testid={`form-input-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        {error && <span className="error">{error}</span>}
      </div>
    )
  }
})

jest.mock('../../components/molecules/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>
}))

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>
const mockNavigate = jest.fn()
const mockToast = jest.fn()

const renderJobPostingPage = () => {
  return render(
    <BrowserRouter>
      <JobPostingPage />
    </BrowserRouter>
  )
}

describe('JobPostingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    ;(require('../../components/ui/use-toast').useToast as jest.Mock).mockReturnValue({
      toast: mockToast
    })
  })

  test('renders initial step with basic job information', () => {
    renderJobPostingPage()
    
    expect(screen.getByText('Post a New Job')).toBeInTheDocument()
    expect(screen.getByText('Basic Job Information')).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    expect(screen.getByText('25% Complete')).toBeInTheDocument()
    
    // Check form inputs
    expect(screen.getByTestId('form-input-job-title')).toBeInTheDocument()
    expect(screen.getByTestId('form-input-company-name')).toBeInTheDocument()
    expect(screen.getByTestId('form-input-department')).toBeInTheDocument()
    expect(screen.getByTestId('form-input-city')).toBeInTheDocument()
  })

  test('validates step 1 form fields', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Try to proceed without filling required fields
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Job title must be at least 5 characters')).toBeInTheDocument()
      expect(screen.getByText('Company name is required')).toBeInTheDocument()
      expect(screen.getByText('City is required')).toBeInTheDocument()
      expect(screen.getByText('State is required')).toBeInTheDocument()
      expect(screen.getByText('Department is required')).toBeInTheDocument()
    })
  })

  test('progresses to step 2 when step 1 is valid', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Fill required fields
    await user.type(screen.getByTestId('form-input-job-title'), 'Senior Software Engineer')
    await user.type(screen.getByTestId('form-input-company-name'), 'Tech Corp')
    await user.type(screen.getByTestId('form-input-department'), 'Engineering')
    await user.type(screen.getByTestId('form-input-city'), 'Sydney')
    
    // Select state
    const stateSelect = screen.getByDisplayValue('Select State')
    await user.selectOptions(stateSelect, 'NSW')
    
    // Click next
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    // Should progress to step 2
    await waitFor(() => {
      expect(screen.getByText('Compensation & Experience')).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
      expect(screen.getByText('50% Complete')).toBeInTheDocument()
    })
  })

  test('handles job type selection', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Select full-time job type
    const fullTimeButton = screen.getByText('Full Time')
    await user.click(fullTimeButton)
    
    // Should be selected (highlighted)
    expect(fullTimeButton.closest('button')).toHaveClass('border-blue-500')
  })

  test('handles work arrangement selection', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Select remote work arrangement
    const remoteButton = screen.getByText('Remote')
    await user.click(remoteButton)
    
    // Should be selected
    expect(remoteButton.closest('button')).toHaveClass('border-blue-500')
  })

  test('validates salary fields in step 2', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Navigate to step 2 first
    await fillStep1AndProceed(user)
    
    // Try to proceed without salary
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Minimum salary is required')).toBeInTheDocument()
      expect(screen.getByText('Maximum salary is required')).toBeInTheDocument()
    })
  })

  test('validates salary range logic', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    await fillStep1AndProceed(user)
    
    // Fill salary with max < min
    await user.type(screen.getByTestId('form-input-minimum-salary'), '100000')
    await user.type(screen.getByTestId('form-input-maximum-salary'), '80000')
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Maximum salary must be greater than minimum')).toBeInTheDocument()
    })
  })

  test('progresses through all steps', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Step 1
    await fillStep1AndProceed(user)
    
    // Step 2
    await fillStep2AndProceed(user)
    
    // Step 3
    await waitFor(() => {
      expect(screen.getByText('Job Description & Requirements')).toBeInTheDocument()
    })
    
    await fillStep3AndProceed(user)
    
    // Step 4
    await waitFor(() => {
      expect(screen.getByText('Contact & Review')).toBeInTheDocument()
      expect(screen.getByText('Job Posting Preview')).toBeInTheDocument()
    })
  })

  test('handles tag addition and removal', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Navigate to step 3
    await fillStep1AndProceed(user)
    await fillStep2AndProceed(user)
    
    // Add tags
    const tagInput = screen.getByPlaceholderText(/Add a skill or technology/i)
    await user.type(tagInput, 'React')
    
    const addButton = screen.getByRole('button', { name: /add/i })
    await user.click(addButton)
    
    // Should show tag
    expect(screen.getByText('React ×')).toBeInTheDocument()
    
    // Remove tag
    const tagBadge = screen.getByText('React ×')
    await user.click(tagBadge)
    
    // Tag should be removed
    expect(screen.queryByText('React ×')).not.toBeInTheDocument()
  })

  test('handles save draft functionality', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockResolvedValue({ data: { success: true } })
    
    renderJobPostingPage()
    
    const saveDraftButton = screen.getByRole('button', { name: /save draft/i })
    await user.click(saveDraftButton)
    
    await waitFor(() => {
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:5000/jobs/draft',
        expect.any(Object)
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Draft Saved',
        description: 'Your job posting draft has been saved.'
      })
    })
  })

  test('handles job submission successfully', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockResolvedValue({ data: { success: true } })
    
    renderJobPostingPage()
    
    // Fill all steps
    await fillAllSteps(user)
    
    // Submit
    const publishButton = screen.getByRole('button', { name: /publish job/i })
    await user.click(publishButton)
    
    await waitFor(() => {
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        'http://localhost:5000/jobs',
        expect.any(Object)
      )
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Job Posted Successfully!',
        description: 'Your job posting has been published and is now visible to job seekers.'
      })
      expect(mockNavigate).toHaveBeenCalledWith('/employer/dashboard')
    })
  })

  test('handles job submission error', async () => {
    const user = userEvent.setup()
    mockHttpClient.post.mockRejectedValue({
      response: { data: { message: 'Server error' } }
    })
    
    renderJobPostingPage()
    
    await fillAllSteps(user)
    
    const publishButton = screen.getByRole('button', { name: /publish job/i })
    await user.click(publishButton)
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Job Posting Failed',
        description: 'Server error',
        variant: 'destructive'
      })
    })
  })

  test('handles back navigation', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    const backButton = screen.getByRole('button', { name: /back/i })
    await user.click(backButton)
    
    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  test('shows access denied for unauthenticated user', () => {
    // Mock no user
    const mockNoUser = require('../../stores/useAuthStore')
    mockNoUser.default = () => ({ user: null })
    
    const NoUserPage = require('../JobPostingPage').default
    
    render(
      <BrowserRouter>
        <NoUserPage />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('You need to be logged in as an employer to post jobs.')).toBeInTheDocument()
  })

  test('handles previous step navigation', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    // Go to step 2
    await fillStep1AndProceed(user)
    
    // Go back to step 1
    const prevButton = screen.getByRole('button', { name: /previous/i })
    await user.click(prevButton)
    
    await waitFor(() => {
      expect(screen.getByText('Basic Job Information')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 4')).toBeInTheDocument()
    })
  })

  test('displays job preview correctly', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    await fillAllSteps(user)
    
    // Should show preview with filled data
    expect(screen.getByText('Senior Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp • Sydney, NSW')).toBeInTheDocument()
  })

  test('validates description and requirements length', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    await fillStep1AndProceed(user)
    await fillStep2AndProceed(user)
    
    // Try to proceed with short description/requirements
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Job description must be at least 100 characters')).toBeInTheDocument()
      expect(screen.getByText('Requirements must be at least 50 characters')).toBeInTheDocument()
    })
  })

  test('handles experience level selection', async () => {
    const user = userEvent.setup()
    renderJobPostingPage()
    
    await fillStep1AndProceed(user)
    
    // Select senior level
    const seniorButton = screen.getByText('Senior Level')
    await user.click(seniorButton)
    
    expect(seniorButton.closest('button')).toHaveClass('border-blue-500')
  })

  // Helper functions
  async function fillStep1AndProceed(user: any) {
    await user.type(screen.getByTestId('form-input-job-title'), 'Senior Software Engineer')
    await user.type(screen.getByTestId('form-input-company-name'), 'Tech Corp')
    await user.type(screen.getByTestId('form-input-department'), 'Engineering')
    await user.type(screen.getByTestId('form-input-city'), 'Sydney')
    
    const stateSelect = screen.getByDisplayValue('Select State')
    await user.selectOptions(stateSelect, 'NSW')
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Compensation & Experience')).toBeInTheDocument()
    })
  }

  async function fillStep2AndProceed(user: any) {
    await user.type(screen.getByTestId('form-input-minimum-salary'), '80000')
    await user.type(screen.getByTestId('form-input-maximum-salary'), '120000')
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Job Description & Requirements')).toBeInTheDocument()
    })
  }

  async function fillStep3AndProceed(user: any) {
    const description = 'This is a comprehensive job description that meets the minimum character requirement for the job posting form validation.'
    const requirements = 'Bachelor degree in Computer Science and 5+ years experience'
    
    await user.type(screen.getByPlaceholderText(/Describe the role, responsibilities/i), description)
    await user.type(screen.getByPlaceholderText(/List required skills/i), requirements)
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    await waitFor(() => {
      expect(screen.getByText('Contact & Review')).toBeInTheDocument()
    })
  }

  async function fillAllSteps(user: any) {
    await fillStep1AndProceed(user)
    await fillStep2AndProceed(user)
    await fillStep3AndProceed(user)
  }
})