import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import JobRecommendations from '../JobRecommendations'
import * as httpClient from '../../../httpClient'
import { buildApiUrl } from '../../../config'

// Mock dependencies
jest.mock('../../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  }
}))

jest.mock('../../../config', () => ({
  buildApiUrl: jest.fn()
}))

jest.mock('../../../stores/useJobApplicationStore', () => ({
  __esModule: true,
  default: () => ({
    addApplication: jest.fn()
  })
}))

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

const mockHttpClient = httpClient.default as jest.Mocked<typeof httpClient.default>
const mockBuildApiUrl = buildApiUrl as jest.MockedFunction<typeof buildApiUrl>
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

const mockRecommendedJobs = [
  {
    _id: '1',
    title: 'Senior React Developer',
    firm: 'Tech Corp',
    location: 'Sydney, NSW',
    jobtype: 'Full-time',
    remuneration_amount: '120000',
    remuneration_period: 'year',
    posted: '2024-01-15T08:00:00Z',
    slug: 'senior-react-developer',
    match_score: 95,
    reasons: ['Skills match job requirements', 'Located in your preferred area']
  },
  {
    _id: '2',
    title: 'Frontend Engineer',
    firm: 'StartupCo',
    location: 'Melbourne, VIC',
    jobtype: 'Contract',
    remuneration_amount: '85000',
    remuneration_period: 'year',
    posted: '2024-01-10T10:00:00Z',
    slug: 'frontend-engineer',
    match_score: 88,
    reasons: ['Recently posted', 'Popular in your industry']
  }
]

const mockMLRecommendationsResponse = {
  recommendations: [
    {
      job: mockRecommendedJobs[0],
      match_score: 0.95,
      reasons: ['Skills match job requirements', 'Located in your preferred area']
    },
    {
      job: mockRecommendedJobs[1], 
      match_score: 0.88,
      reasons: ['Recently posted', 'Popular in your industry']
    }
  ]
}

const mockFallbackJobs = [
  {
    _id: '3',
    title: 'JavaScript Developer',
    firm: 'WebDev Inc',
    location: 'Brisbane, QLD',
    jobtype: 'Full-time',
    remuneration_amount: '90000',
    remuneration_period: 'year',
    posted: '2024-01-12T12:00:00Z'
  }
]

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <JobRecommendations {...props} />
    </BrowserRouter>
  )
}

describe('JobRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockBuildApiUrl.mockImplementation((path) => `http://localhost:5000${path}`)
  })

  test('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves

    renderComponent()

    expect(screen.getByText('Personalized Recommendations')).toBeInTheDocument()
    expect(screen.getAllByRole('generic')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ className: expect.stringContaining('animate-pulse') })
      ])
    )
  })

  test('successfully loads ML recommendations', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })

    expect(screen.getByText('Tech Corp')).toBeInTheDocument()
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
    expect(screen.getByText('95% match')).toBeInTheDocument()
    expect(screen.getByText('Frontend Engineer')).toBeInTheDocument()
    expect(screen.getByText('88% match')).toBeInTheDocument()
  })

  test('falls back to general jobs when ML recommendations fail', async () => {
    // First fetch (ML recommendations) fails
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      } as Response) // Profile fetch also fails

    // Fallback HTTP client call succeeds
    mockHttpClient.get.mockResolvedValueOnce({
      data: mockFallbackJobs
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('JavaScript Developer')).toBeInTheDocument()
    })

    expect(screen.getByText('WebDev Inc')).toBeInTheDocument()
    expect(screen.getByText('Brisbane, QLD')).toBeInTheDocument()
  })

  test('displays error state when all fetching fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    mockHttpClient.get.mockRejectedValue(new Error('HTTP client error'))

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Unable to load recommendations')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to load job recommendations')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  test('displays empty state when no recommendations available', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      } as Response)

    mockHttpClient.get.mockResolvedValueOnce({
      data: []
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('No recommendations available')).toBeInTheDocument()
    })

    expect(screen.getByText('Complete your profile to get personalized job suggestions')).toBeInTheDocument()
  })

  test('handles refresh button click', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: 'Refresh' })
    await user.click(refreshButton)

    // Verify fetch was called again
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  test('handles try again button in error state', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Unable to load recommendations')).toBeInTheDocument()
    })

    const tryAgainButton = screen.getByRole('button', { name: 'Try again' })
    await user.click(tryAgainButton)

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })
  })

  test('formats salary correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('$120000/year')).toBeInTheDocument()
      expect(screen.getByText('$85000/year')).toBeInTheDocument()
    })
  })

  test('formats posting date correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText(/days ago|weeks ago|months ago/)).toBeInTheDocument()
    })
  })

  test('handles save job functionality', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })

    const saveButtons = screen.getAllByRole('button')
    const saveButton = saveButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-400')
    )

    if (saveButton) {
      await user.click(saveButton)
      expect(saveButton).toHaveClass('text-red-500')
    }
  })

  test('handles quick apply functionality', async () => {
    const mockAddApplication = jest.fn()
    jest.doMock('../../../stores/useJobApplicationStore', () => ({
      __esModule: true,
      default: () => ({
        addApplication: mockAddApplication
      })
    }))

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })

    const quickApplyButton = screen.getByRole('button', { name: 'Quick Apply' })
    await user.click(quickApplyButton)

    expect(mockAddApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        jobTitle: 'Senior React Developer',
        company: 'Tech Corp',
        location: 'Sydney, NSW',
        status: 'applied'
      })
    )
  })

  test('handles external job link clicks', async () => {
    // Mock window.open
    const mockWindowOpen = jest.fn()
    Object.defineProperty(window, 'open', {
      writable: true,
      value: mockWindowOpen
    })

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    const user = userEvent.setup()
    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Senior React Developer')).toBeInTheDocument()
    })

    const externalLinkButtons = screen.getAllByRole('button')
    const externalButton = externalLinkButtons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-xs')
    )

    if (externalButton) {
      await user.click(externalButton)
      expect(mockWindowOpen).toHaveBeenCalledWith('/job-details/senior-react-developer', '_blank')
    }
  })

  test('displays job reasons when available', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Skills match job requirements')).toBeInTheDocument()
    })

    expect(screen.getByText('Located in your preferred area')).toBeInTheDocument()
    expect(screen.getByText('Why this matches:')).toBeInTheDocument()
  })

  test('shows view all jobs button when recommendations exist', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMLRecommendationsResponse)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'View All Jobs' })).toBeInTheDocument()
    })
  })

  test('applies custom className prop', () => {
    renderComponent({ className: 'custom-class-name' })

    const card = screen.getByText('Personalized Recommendations').closest('div')
    expect(card).toHaveClass('custom-class-name')
  })

  test('handles user profile integration for enhanced fallback', async () => {
    const mockUserProfile = {
      location: { city: 'Sydney' },
      skills: ['React', 'JavaScript'],
      experience: [
        { startDate: '2020-01-01', current: true },
        { startDate: '2018-01-01', endDate: '2019-12-31' }
      ],
      preferences: { jobType: ['Full-time'] }
    }

    // ML recommendations fail
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({})
      } as Response)
      // Profile fetch succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUserProfile)
      } as Response)

    mockHttpClient.get.mockResolvedValueOnce({
      data: mockFallbackJobs
    })

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('JavaScript Developer')).toBeInTheDocument()
    })

    // Should have enhanced the fallback jobs with user profile matching
    expect(mockBuildApiUrl).toHaveBeenCalledWith('/users/profile')
  })

  test('handles job cards with missing optional fields', async () => {
    const incompleteJob = {
      recommendations: [
        {
          job: {
            _id: '999',
            title: 'Test Job',
            firm: 'Test Company',
            location: 'Test Location',
            jobtype: 'Full-time',
            remuneration_amount: '50000',
            remuneration_period: 'year',
            posted: '2024-01-01T00:00:00Z'
            // Missing slug and reasons
          },
          match_score: 0.75,
          reasons: []
        }
      ]
    }

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(incompleteJob)
      } as Response)

    renderComponent()

    await waitFor(() => {
      expect(screen.getByText('Test Job')).toBeInTheDocument()
    })

    expect(screen.getByText('Test Company')).toBeInTheDocument()
    expect(screen.getByText('75% match')).toBeInTheDocument()
  })
})