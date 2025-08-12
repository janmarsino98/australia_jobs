import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import MiniJobCard from '../MiniJobCard'

const renderComponent = (props = {}) => {
  const defaultProps = {
    jobTitle: 'Software Developer',
    jobType: 'Full-time',
    jobSchedule: 'Hybrid'
  }
  
  return render(
    <BrowserRouter>
      <MiniJobCard {...defaultProps} {...props} />
    </BrowserRouter>
  )
}

describe('MiniJobCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders job information correctly', () => {
    renderComponent({
      jobTitle: 'Senior Frontend Developer',
      jobType: 'Full-time',
      jobSchedule: 'Remote'
    })

    expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('Full-time-Remote')).toBeInTheDocument()
  })

  test('renders with default props', () => {
    renderComponent()

    expect(screen.getByText('Software Developer')).toBeInTheDocument()
    expect(screen.getByText('Full-time-Hybrid')).toBeInTheDocument()
  })

  test('displays job type and schedule with dash separator', () => {
    renderComponent({
      jobTitle: 'Data Analyst',
      jobType: 'Part-time',
      jobSchedule: 'On-site'
    })

    expect(screen.getByText('Part-time-On-site')).toBeInTheDocument()
  })

  test('renders company avatar with letter A', () => {
    renderComponent()

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  test('has correct container structure and styling', () => {
    renderComponent()
    
    const container = screen.getByText('Software Developer').closest('div')?.parentElement
    expect(container).toHaveClass('w-max', 'flex', 'flex-row', 'gap-4', 'h-max')
  })

  test('avatar container has correct styling', () => {
    renderComponent()
    
    const avatar = screen.getByText('A').parentElement
    expect(avatar).toHaveClass('w-[45px]', 'h-[45px]', 'rounded-full', 'flex', 'items-center', 'justify-center', 'bg-green-900', 'border-4', 'border-stone-600')
  })

  test('job title has correct font styling', () => {
    renderComponent()
    
    const jobTitle = screen.getByText('Software Developer')
    expect(jobTitle).toHaveClass('font-bold', 'text-[16px]')
  })

  test('job type and schedule text has correct styling', () => {
    renderComponent()
    
    const jobTypeSchedule = screen.getByText('Full-time-Hybrid')
    expect(jobTypeSchedule).toHaveClass('text-searchbar-text', 'text-[14px]')
  })

  test('renders with different job title values', () => {
    const jobTitles = [
      'Backend Developer',
      'Product Manager', 
      'UX Designer',
      'DevOps Engineer'
    ]

    jobTitles.forEach(title => {
      render(
        <BrowserRouter>
          <MiniJobCard 
            jobTitle={title}
            jobType="Full-time"
            jobSchedule="Remote"
          />
        </BrowserRouter>
      )
      expect(screen.getByText(title)).toBeInTheDocument()
    })
  })

  test('renders with different job types and schedules', () => {
    const combinations = [
      { jobType: 'Contract', jobSchedule: 'Remote' },
      { jobType: 'Freelance', jobSchedule: 'On-site' },
      { jobType: 'Internship', jobSchedule: 'Hybrid' },
      { jobType: 'Full-time', jobSchedule: 'Flexible' }
    ]

    combinations.forEach(({ jobType, jobSchedule }, index) => {
      render(
        <BrowserRouter>
          <MiniJobCard 
            key={index}
            jobTitle={`Test Job ${index}`}
            jobType={jobType}
            jobSchedule={jobSchedule}
          />
        </BrowserRouter>
      )
      expect(screen.getByText(`${jobType}-${jobSchedule}`)).toBeInTheDocument()
    })
  })

  test('handles long job titles without breaking layout', () => {
    const longTitle = 'Senior Full-Stack JavaScript Developer with React and Node.js Experience'
    renderComponent({
      jobTitle: longTitle,
      jobType: 'Full-time',
      jobSchedule: 'Remote'
    })

    expect(screen.getByText(longTitle)).toBeInTheDocument()
    
    const container = screen.getByText(longTitle).closest('div')?.parentElement
    expect(container).toHaveClass('w-max')
  })

  test('maintains semantic structure', () => {
    renderComponent()
    
    const jobTitle = screen.getByText('Software Developer')
    const jobDetails = screen.getByText('Full-time-Hybrid')
    
    // Job title should be the first span in the text container
    expect(jobTitle.tagName).toBe('SPAN')
    expect(jobDetails.tagName).toBe('SPAN')
    
    // Both should be in the same flex column container
    const textContainer = jobTitle.parentElement
    expect(textContainer).toContainElement(jobDetails)
    expect(textContainer).toHaveClass('flex', 'flex-col', 'justify-center')
  })

  test('renders without optional jobImg prop', () => {
    // Component should work without the optional jobImg prop
    renderComponent({
      jobTitle: 'Test Position',
      jobType: 'Contract',
      jobSchedule: 'Remote'
    })

    expect(screen.getByText('Test Position')).toBeInTheDocument()
    expect(screen.getByText('A')).toBeInTheDocument() // Default avatar
  })
})