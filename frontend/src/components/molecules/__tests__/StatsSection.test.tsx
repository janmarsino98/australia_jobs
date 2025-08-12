import { render, screen } from '@testing-library/react'
import { StatsSection } from '../StatsSection'

const renderComponent = (props = {}) => {
  const defaultProps = {
    stats: [
      { number: '10,000+', label: 'Jobs Available' },
      { number: '5,000+', label: 'Companies' },
      { number: '50,000+', label: 'Job Seekers' },
      { number: '95%', label: 'Success Rate' }
    ]
  }
  return render(<StatsSection {...defaultProps} {...props} />)
}

describe('StatsSection', () => {
  test('renders all stat items correctly', () => {
    renderComponent()
    
    expect(screen.getByText('10,000+')).toBeInTheDocument()
    expect(screen.getByText('Jobs Available')).toBeInTheDocument()
    expect(screen.getByText('5,000+')).toBeInTheDocument()
    expect(screen.getByText('Companies')).toBeInTheDocument()
    expect(screen.getByText('50,000+')).toBeInTheDocument()
    expect(screen.getByText('Job Seekers')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByText('Success Rate')).toBeInTheDocument()
  })

  test('applies custom className', () => {
    const customClass = 'custom-stats-class'
    renderComponent({ className: customClass })
    
    const section = screen.getByText('10,000+').closest('section')
    expect(section).toHaveClass(customClass)
  })

  test('has default section styling', () => {
    renderComponent()
    
    const section = screen.getByText('10,000+').closest('section')
    expect(section).toHaveClass('px-6', 'py-[60px]')
  })

  test('has responsive container styling', () => {
    renderComponent()
    
    const container = screen.getByText('10,000+').closest('div')?.parentElement
    expect(container).toHaveClass('max-w-6xl', 'mx-auto')
  })

  test('has responsive grid layout', () => {
    renderComponent()
    
    const gridContainer = screen.getByText('10,000+').closest('div')?.parentElement
    expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-8', 'text-center')
  })

  test('stat items have correct structure and styling', () => {
    renderComponent()
    
    const statItems = screen.getAllByText(/\+|%/).map(el => el.closest('div'))
    
    statItems.forEach(item => {
      expect(item).toHaveClass('flex', 'flex-col', 'space-y-2')
    })
  })

  test('stat numbers have correct styling', () => {
    renderComponent()
    
    const numberElements = [
      screen.getByText('10,000+'),
      screen.getByText('5,000+'),
      screen.getByText('50,000+'),
      screen.getByText('95%')
    ]
    
    numberElements.forEach(element => {
      expect(element).toHaveClass('text-3xl', 'font-bold', 'text-pill-text')
    })
  })

  test('stat labels have correct styling', () => {
    renderComponent()
    
    const labelElements = [
      screen.getByText('Jobs Available'),
      screen.getByText('Companies'),
      screen.getByText('Job Seekers'),
      screen.getByText('Success Rate')
    ]
    
    labelElements.forEach(element => {
      expect(element).toHaveClass('text-searchbar-text', 'font-medium')
    })
  })

  test('renders with custom stats data', () => {
    const customStats = [
      { number: '1,000', label: 'Active Users' },
      { number: '99.9%', label: 'Uptime' }
    ]
    
    renderComponent({ stats: customStats })
    
    expect(screen.getByText('1,000')).toBeInTheDocument()
    expect(screen.getByText('Active Users')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('Uptime')).toBeInTheDocument()
    
    // Should not render the default stats
    expect(screen.queryByText('10,000+')).not.toBeInTheDocument()
    expect(screen.queryByText('Jobs Available')).not.toBeInTheDocument()
  })

  test('renders with empty stats array', () => {
    renderComponent({ stats: [] })
    
    const section = screen.getByRole('region', { hidden: true }) || screen.getByTestId('stats-section') || document.querySelector('section')
    expect(section).toBeInTheDocument()
    
    // No stat items should be rendered
    expect(screen.queryByText(/\d/)).not.toBeInTheDocument()
  })

  test('renders with single stat item', () => {
    const singleStat = [
      { number: '100%', label: 'Satisfaction' }
    ]
    
    renderComponent({ stats: singleStat })
    
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('Satisfaction')).toBeInTheDocument()
    
    // Grid should still have responsive classes
    const gridContainer = screen.getByText('100%').closest('div')?.parentElement
    expect(gridContainer).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4')
  })

  test('handles stats with special characters', () => {
    const specialStats = [
      { number: '10K+', label: 'Downloads' },
      { number: '$1M+', label: 'Revenue' },
      { number: '24/7', label: 'Support' },
      { number: '5★', label: 'Rating' }
    ]
    
    renderComponent({ stats: specialStats })
    
    expect(screen.getByText('10K+')).toBeInTheDocument()
    expect(screen.getByText('$1M+')).toBeInTheDocument()
    expect(screen.getByText('24/7')).toBeInTheDocument()
    expect(screen.getByText('5★')).toBeInTheDocument()
  })

  test('maintains proper semantic structure', () => {
    renderComponent()
    
    const section = screen.getByText('10,000+').closest('section')
    expect(section).toBeInTheDocument()
    expect(section?.tagName.toLowerCase()).toBe('section')
  })

  test('stat items are ordered correctly', () => {
    renderComponent()
    
    const numbers = screen.getAllByText(/\+|%/)
    expect(numbers[0]).toHaveTextContent('10,000+')
    expect(numbers[1]).toHaveTextContent('5,000+')
    expect(numbers[2]).toHaveTextContent('50,000+')
    expect(numbers[3]).toHaveTextContent('95%')
  })

  test('uses correct key indices for stat items', () => {
    const stats = [
      { number: '1', label: 'First' },
      { number: '2', label: 'Second' },
      { number: '3', label: 'Third' }
    ]
    
    renderComponent({ stats })
    
    const statItems = screen.getAllByText(/\d/)
    expect(statItems).toHaveLength(3)
    expect(statItems[0]).toHaveTextContent('1')
    expect(statItems[1]).toHaveTextContent('2')
    expect(statItems[2]).toHaveTextContent('3')
  })

  test('handles long stat labels gracefully', () => {
    const longLabelStats = [
      { number: '100', label: 'This is a very long label that might wrap' },
      { number: '200', label: 'Another extremely long label for testing purposes' }
    ]
    
    renderComponent({ stats: longLabelStats })
    
    expect(screen.getByText('This is a very long label that might wrap')).toBeInTheDocument()
    expect(screen.getByText('Another extremely long label for testing purposes')).toBeInTheDocument()
  })

  test('handles large numbers in stats', () => {
    const largeNumberStats = [
      { number: '1,234,567', label: 'Large Number' },
      { number: '999,999,999+', label: 'Very Large Number' }
    ]
    
    renderComponent({ stats: largeNumberStats })
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
    expect(screen.getByText('999,999,999+')).toBeInTheDocument()
  })

  test('combines custom className with default classes', () => {
    const customClass = 'bg-gray-100'
    renderComponent({ className: customClass })
    
    const section = screen.getByText('10,000+').closest('section')
    expect(section).toHaveClass('px-6', 'py-[60px]', customClass)
  })
})