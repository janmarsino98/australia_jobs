import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LoadingSpinner } from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders loading text', () => {
    render(<LoadingSpinner />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('updates progress over time', () => {
    render(<LoadingSpinner />)
    const progressBar = screen.getByRole('progressbar')
    
    expect(progressBar).toHaveAttribute('aria-valuenow', '13')
    
    jest.advanceTimersByTime(500)
    expect(progressBar).toHaveAttribute('aria-valuenow', '26')
    
    jest.advanceTimersByTime(500)
    expect(progressBar).toHaveAttribute('aria-valuenow', '39')
  })

  it('resets progress when reaching 100', () => {
    render(<LoadingSpinner />)
    const progressBar = screen.getByRole('progressbar')
    
    // Advance time to reach over 100%
    jest.advanceTimersByTime(4000)
    expect(progressBar).toHaveAttribute('aria-valuenow', '13')
  })
}) 