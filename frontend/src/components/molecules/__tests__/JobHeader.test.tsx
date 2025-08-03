import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { JobHeader } from '../JobHeader'

describe('JobHeader', () => {
  const defaultProps = {
    title: 'Senior Frontend Developer',
    firm: 'Tech Solutions Inc',
    location: 'Sydney, NSW',
    jobType: 'Full-time',
    salary: {
      amount: '$120,000',
      period: 'year'
    },
    postedDate: '2 days ago',
    onApply: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders job title correctly', () => {
    render(<JobHeader {...defaultProps} />)
    
    const title = screen.getByRole('heading', { level: 1 })
    expect(title).toBeInTheDocument()
    expect(title).toHaveTextContent('Senior Frontend Developer')
    expect(title).toHaveClass('text-4xl', 'font-bold', 'tracking-tighter', 'text-gray-800', 'mb-4')
  })

  test('displays firm information with building icon', () => {
    render(<JobHeader {...defaultProps} />)
    
    expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument()
    
    // Check for building icon by looking for the badge that contains the firm
    const firmBadge = screen.getByText('Tech Solutions Inc').closest('div')
    expect(firmBadge).toHaveClass('flex', 'items-center')
  })

  test('displays location information with map pin icon', () => {
    render(<JobHeader {...defaultProps} />)
    
    expect(screen.getByText('Sydney, NSW')).toBeInTheDocument()
    
    const locationBadge = screen.getByText('Sydney, NSW').closest('div')
    expect(locationBadge).toHaveClass('flex', 'items-center')
  })

  test('displays job type with briefcase icon', () => {
    render(<JobHeader {...defaultProps} />)
    
    expect(screen.getByText('Full-time')).toBeInTheDocument()
    
    const jobTypeBadge = screen.getByText('Full-time').closest('div')
    expect(jobTypeBadge).toHaveClass('flex', 'items-center')
  })

  test('displays salary information with dollar sign icon', () => {
    render(<JobHeader {...defaultProps} />)
    
    expect(screen.getByText('$120,000 / year')).toBeInTheDocument()
    
    const salaryBadge = screen.getByText('$120,000 / year').closest('div')
    expect(salaryBadge).toHaveClass('flex', 'items-center')
  })

  test('displays posted date with calendar icon', () => {
    render(<JobHeader {...defaultProps} />)
    
    expect(screen.getByText('Posted 2 days ago')).toBeInTheDocument()
    
    const dateBadge = screen.getByText('Posted 2 days ago').closest('div')
    expect(dateBadge).toHaveClass('flex', 'items-center')
  })

  test('handles apply button click', async () => {
    const user = userEvent.setup()
    const mockOnApply = jest.fn()
    
    render(<JobHeader {...defaultProps} onApply={mockOnApply} />)
    
    const applyButton = screen.getByRole('button', { name: 'Apply Now' })
    expect(applyButton).toBeInTheDocument()
    expect(applyButton).toHaveClass('w-full', 'sm:w-auto', 'bg-blue-500', 'hover:bg-blue-600', 'text-white')
    
    await user.click(applyButton)
    
    expect(mockOnApply).toHaveBeenCalledTimes(1)
  })

  test('renders with different salary formats', () => {
    const { rerender } = render(
      <JobHeader 
        {...defaultProps} 
        salary={{ amount: '$50', period: 'hour' }} 
      />
    )
    
    expect(screen.getByText('$50 / hour')).toBeInTheDocument()
    
    rerender(
      <JobHeader 
        {...defaultProps} 
        salary={{ amount: '$8,000', period: 'month' }} 
      />
    )
    
    expect(screen.getByText('$8,000 / month')).toBeInTheDocument()
  })

  test('renders with different job types', () => {
    const { rerender } = render(
      <JobHeader {...defaultProps} jobType="Contract" />
    )
    
    expect(screen.getByText('Contract')).toBeInTheDocument()
    
    rerender(
      <JobHeader {...defaultProps} jobType="Part-time" />
    )
    
    expect(screen.getByText('Part-time')).toBeInTheDocument()
  })

  test('all badges have secondary variant styling', () => {
    render(<JobHeader {...defaultProps} />)
    
    const badges = screen.getAllByText(/Tech Solutions Inc|Sydney, NSW|Full-time|Posted 2 days ago/).map(
      element => element.closest('div')
    )
    
    badges.forEach(badge => {
      expect(badge).toHaveClass('flex', 'items-center')
    })
  })

  test('apply button has correct size and styling', () => {
    render(<JobHeader {...defaultProps} />)
    
    const applyButton = screen.getByRole('button', { name: 'Apply Now' })
    expect(applyButton).toHaveClass('w-full', 'sm:w-auto')
  })

  test('renders with long job titles', () => {
    const longTitle = 'Senior Full Stack Software Engineer with React and Node.js Experience'
    render(<JobHeader {...defaultProps} title={longTitle} />)
    
    expect(screen.getByText(longTitle)).toBeInTheDocument()
  })

  test('renders section with correct semantic structure', () => {
    const { container } = render(<JobHeader {...defaultProps} />)
    
    const section = container.querySelector('section')
    expect(section).toBeInTheDocument()
    
    // Should have heading, badges container, and button
    expect(section?.children).toHaveLength(3)
  })
})