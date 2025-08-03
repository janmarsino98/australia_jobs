import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import JobCard from '../JobCard'

describe('JobCard', () => {
  const defaultProps = {
    title: 'Frontend Developer',
    minSalary: 5000,
    maxSalary: 8000,
    imgSrc: 'https://example.com/job-image.jpg'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders job information correctly', () => {
    render(<JobCard {...defaultProps} />)
    
    expect(screen.getByText('Frontend Developer')).toBeInTheDocument()
    expect(screen.getByText('$5000-$8000/month')).toBeInTheDocument()
    
    const image = screen.getByAltText('Job Card Img')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/job-image.jpg')
  })

  test('displays formatted salary range', () => {
    render(<JobCard {...defaultProps} minSalary={3000} maxSalary={6000} />)
    
    expect(screen.getByText('$3000-$6000/month')).toBeInTheDocument()
  })

  test('renders loading state correctly', () => {
    render(<JobCard {...defaultProps} isLoading={true} />)
    
    // Should not render job details when loading
    expect(screen.queryByText('Frontend Developer')).not.toBeInTheDocument()
    expect(screen.queryByText('$5000-$8000/month')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Job Card Img')).not.toBeInTheDocument()
    
    // Should render loading skeleton with animation
    const loadingContainer = document.querySelector('.animate-pulse')
    expect(loadingContainer).toBeInTheDocument()
    expect(loadingContainer).toHaveClass('animate-pulse')
  })

  test('renders with different title values', () => {
    const { rerender } = render(<JobCard {...defaultProps} title="Backend Developer" />)
    expect(screen.getByText('Backend Developer')).toBeInTheDocument()
    
    rerender(<JobCard {...defaultProps} title="Full Stack Engineer" />)
    expect(screen.getByText('Full Stack Engineer')).toBeInTheDocument()
  })

  test('handles various salary ranges', () => {
    const { rerender } = render(<JobCard {...defaultProps} minSalary={0} maxSalary={1000} />)
    expect(screen.getByText('$0-$1000/month')).toBeInTheDocument()
    
    rerender(<JobCard {...defaultProps} minSalary={10000} maxSalary={15000} />)
    expect(screen.getByText('$10000-$15000/month')).toBeInTheDocument()
  })

  test('image has correct styling classes', () => {
    render(<JobCard {...defaultProps} />)
    
    const image = screen.getByAltText('Job Card Img')
    expect(image).toHaveClass('h-full', 'w-full', 'object-cover', 'rounded-[12px]')
  })

  test('container has correct layout classes', () => {
    const { container } = render(<JobCard {...defaultProps} />)
    
    const mainContainer = container.firstChild
    expect(mainContainer).toHaveClass('flex', 'flex-col', 'my-[15px]')
  })

  test('title and salary have correct styling', () => {
    render(<JobCard {...defaultProps} />)
    
    const titleElement = screen.getByText('Frontend Developer')
    expect(titleElement).toHaveClass('text-[16px]', 'mt-[12px]')
    
    const salaryElement = screen.getByText('$5000-$8000/month')
    expect(salaryElement).toHaveClass('text-searchbar-text')
  })
})