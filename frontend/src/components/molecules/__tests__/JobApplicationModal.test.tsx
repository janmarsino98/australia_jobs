import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import JobApplicationModal from '../JobApplicationModal'

// Mock dependencies
jest.mock('../../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`)
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

jest.mock('../../../hooks/useZodForm', () => ({
  useZodForm: jest.fn(() => ({
    register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
    handleSubmit: jest.fn((onSubmit) => (e) => {
      e.preventDefault()
      onSubmit({
        coverLetter: 'This is a test cover letter that meets the minimum length requirement for the application form.',
        phone: '+61412345678',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        portfolioUrl: 'https://testportfolio.com',
        availabilityDate: '2024-12-01',
        salaryExpectation: '$80,000 AUD'
      })
    }),
    setValue: jest.fn(),
    watch: jest.fn(() => 'This is a test cover letter that meets the minimum length requirement.'),
    formState: { errors: {}, isSubmitting: false },
    setError: jest.fn()
  }))
}))

jest.mock('../../ui/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn()
  }))
}))

jest.mock('../../../stores/useJobApplicationStore', () => ({
  __esModule: true,
  default: () => ({
    addApplication: jest.fn()
  })
}))

jest.mock('../EnhancedFormInput', () => {
  return function EnhancedFormInput({ label, error, ...props }: any) {
    return (
      <div>
        <label>{label}</label>
        <input {...props} />
        {error && <span className="error">{error}</span>}
      </div>
    )
  }
})

// Mock fetch
global.fetch = jest.fn()

const mockNavigate = jest.fn()

const renderModal = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    job: {
      id: 'job-123',
      title: 'Senior Frontend Developer',
      firm: 'Tech Corp',
      location: 'Sydney, NSW',
      jobtype: 'Full-time'
    },
    ...props
  }

  return render(
    <BrowserRouter>
      <JobApplicationModal {...defaultProps} />
    </BrowserRouter>
  )
}

describe('JobApplicationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(require('react-router-dom').useNavigate as jest.Mock).mockReturnValue(mockNavigate)
    
    // Mock successful resume check
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({})
    })
  })

  test('renders modal when open', () => {
    renderModal()
    
    expect(screen.getByText('Apply for Senior Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Tech Corp • Sydney, NSW')).toBeInTheDocument()
    expect(screen.getByText('Cover Letter *')).toBeInTheDocument()
    expect(screen.getByText('Resume')).toBeInTheDocument()
  })

  test('does not render when closed', () => {
    renderModal({ isOpen: false })
    
    expect(screen.queryByText('Apply for Senior Frontend Developer')).not.toBeInTheDocument()
  })

  test('handles close button click', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    renderModal({ onClose })
    
    const closeButton = screen.getByRole('button', { name: '' }) // X button
    await user.click(closeButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('displays cover letter textarea with character count', () => {
    renderModal()
    
    const textarea = screen.getByPlaceholderText('Tell us why you\'re perfect for this role...')
    expect(textarea).toBeInTheDocument()
    expect(screen.getByText('0/2000')).toBeInTheDocument()
  })

  test('shows existing resume message when user has resume', async () => {
    renderModal()
    
    await waitFor(() => {
      expect(screen.getByText('We\'ll use your existing resume from your profile')).toBeInTheDocument()
    })
  })

  test('handles file upload', async () => {
    const user = userEvent.setup()
    renderModal()
    
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText('Choose File')
    
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByText('resume.pdf')).toBeInTheDocument()
    })
  })

  test('handles file removal', async () => {
    const user = userEvent.setup()
    const { container } = renderModal()
    
    // First upload a file
    const file = new File(['dummy content'], 'resume.pdf', { type: 'application/pdf' })
    const fileInput = container.querySelector('#resume-upload') as HTMLInputElement
    
    if (fileInput) {
      await user.upload(fileInput, file)
      
      await waitFor(() => {
        expect(screen.getByText('resume.pdf')).toBeInTheDocument()
      })
      
      // Then remove it
      const removeButton = screen.getByRole('button', { name: '' }) // Trash icon button
      await user.click(removeButton)
      
      await waitFor(() => {
        expect(screen.queryByText('resume.pdf')).not.toBeInTheDocument()
      })
    }
  })

  test('handles form submission successfully', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
    
    renderModal({ onClose })
    
    // Fill in cover letter
    const textarea = screen.getByPlaceholderText('Tell us why you\'re perfect for this role...')
    await user.type(textarea, 'This is a comprehensive cover letter that explains why I am the perfect candidate for this position.')
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Application/i })
    await user.click(submitButton)
    
    // Should show success state
    await waitFor(() => {
      expect(screen.getByText('Application Submitted Successfully!')).toBeInTheDocument()
    })
  })

  test('handles API error during submission', async () => {
    const user = userEvent.setup()
    
    // Mock API error
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))
    
    renderModal()
    
    const submitButton = screen.getByRole('button', { name: /Submit Application/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to submit application/)).toBeInTheDocument()
    })
  })

  test('validates required fields', async () => {
    const user = userEvent.setup()
    
    // Mock form with validation errors
    const mockUseZodForm = require('../../../hooks/useZodForm').useZodForm as jest.Mock
    mockUseZodForm.mockReturnValue({
      register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
      handleSubmit: jest.fn(() => (e) => e.preventDefault()),
      setValue: jest.fn(),
      watch: jest.fn(() => ''),
      formState: { 
        errors: { 
          coverLetter: { message: 'Cover letter must be at least 50 characters' }
        }, 
        isSubmitting: false 
      },
      setError: jest.fn()
    })
    
    renderModal()
    
    expect(screen.getByText('Cover letter must be at least 50 characters')).toBeInTheDocument()
  })

  test('disables submit button when submitting', async () => {
    // Mock submitting state
    const mockUseZodForm = require('../../../hooks/useZodForm').useZodForm as jest.Mock
    mockUseZodForm.mockReturnValue({
      register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
      handleSubmit: jest.fn((onSubmit) => (e) => e.preventDefault()),
      setValue: jest.fn(),
      watch: jest.fn(() => 'Valid cover letter content'),
      formState: { errors: {}, isSubmitting: true },
      setError: jest.fn()
    })
    
    renderModal()
    
    const submitButton = screen.getByRole('button', { name: /Submit Application/i })
    expect(submitButton).toBeDisabled()
  })

  test('displays loading state during submission', async () => {
    // Mock submitting state
    const mockUseZodForm = require('../../../hooks/useZodForm').useZodForm as jest.Mock
    mockUseZodForm.mockReturnValue({
      register: jest.fn((name) => ({ name, onChange: jest.fn(), onBlur: jest.fn() })),
      handleSubmit: jest.fn((onSubmit) => (e) => e.preventDefault()),
      setValue: jest.fn(),
      watch: jest.fn(() => 'Valid cover letter content'),
      formState: { errors: {}, isSubmitting: true },
      setError: jest.fn()
    })
    
    renderModal()
    
    expect(screen.getByText('Submitting...')).toBeInTheDocument()
  })

  test('handles cancel button', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()
    
    renderModal({ onClose })
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  test('checks for existing resume on mount', async () => {
    renderModal()
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/resume/current',
        expect.objectContaining({
          credentials: 'include'
        })
      )
    })
  })

  test('shows different message when no existing resume', async () => {
    // Mock no existing resume
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('No resume found'))
    
    renderModal()
    
    await waitFor(() => {
      expect(screen.getByText('Upload your resume')).toBeInTheDocument()
    })
  })

  test('renders all form fields correctly', () => {
    renderModal()
    
    expect(screen.getByText('Phone Number')).toBeInTheDocument()
    expect(screen.getByText('LinkedIn Profile')).toBeInTheDocument()
    expect(screen.getByText('Portfolio URL')).toBeInTheDocument()
    expect(screen.getByText('Available Start Date')).toBeInTheDocument()
    expect(screen.getByText('Salary Expectation')).toBeInTheDocument()
  })

  test('shows file type restrictions', () => {
    renderModal()
    
    expect(screen.getByText('PDF, DOC, or DOCX (max 5MB)')).toBeInTheDocument()
  })
})