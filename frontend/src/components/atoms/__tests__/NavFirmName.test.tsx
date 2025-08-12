import { render, screen } from '@testing-library/react'
import NavFirmName from '../NavFirmName'

describe('NavFirmName', () => {
  test('renders firm name display', () => {
    render(<NavFirmName name="Acme Corporation" />)
    
    const firmName = screen.getByText('Acme Corporation')
    
    expect(firmName).toBeInTheDocument()
  })

  test('handles different firm names', () => {
    render(<NavFirmName name="Tech Solutions Inc." />)
    
    const firmName = screen.getByText('Tech Solutions Inc.')
    
    expect(firmName).toBeInTheDocument()
  })

  test('handles empty name', () => {
    const { container } = render(<NavFirmName name="" />)
    
    const firmNameDiv = container.querySelector('div')
    
    expect(firmNameDiv).toBeInTheDocument()
    expect(firmNameDiv).toHaveTextContent('')
  })

  test('has proper styling classes', () => {
    render(<NavFirmName name="Test Company" />)
    
    const firmName = screen.getByText('Test Company')
    
    expect(firmName).toHaveClass(
      'text-xl',
      'font-semibold',
      'text-main-text',
      'transition-colors',
      'duration-200',
      'group-hover:text-pill-text'
    )
  })

  test('handles long names with proper text rendering', () => {
    const longName = "Very Long Company Name That Should Still Display Properly"
    render(<NavFirmName name={longName} />)
    
    const firmName = screen.getByText(longName)
    
    expect(firmName).toBeInTheDocument()
    expect(firmName).toHaveTextContent(longName)
  })

  test('handles special characters in name', () => {
    render(<NavFirmName name="Company & Associates, LLC" />)
    
    const firmName = screen.getByText('Company & Associates, LLC')
    
    expect(firmName).toBeInTheDocument()
  })

  test('handles names with HTML characters', () => {
    render(<NavFirmName name="Tech <Solutions>" />)
    
    const firmName = screen.getByText('Tech <Solutions>')
    
    expect(firmName).toBeInTheDocument()
  })

  test('handles names with quotes', () => {
    render(<NavFirmName name='"Quoted Company" Name' />)
    
    const firmName = screen.getByText('"Quoted Company" Name')
    
    expect(firmName).toBeInTheDocument()
  })

  test('renders as div element', () => {
    const { container } = render(<NavFirmName name="Test" />)
    
    const div = container.querySelector('div')
    
    expect(div).toBeInTheDocument()
    expect(div).toHaveTextContent('Test')
  })

  test('has transition classes for hover effects', () => {
    render(<NavFirmName name="Hover Test" />)
    
    const firmName = screen.getByText('Hover Test')
    
    expect(firmName).toHaveClass('transition-colors', 'duration-200')
    expect(firmName).toHaveClass('group-hover:text-pill-text')
  })

  test('maintains text color classes', () => {
    render(<NavFirmName name="Color Test" />)
    
    const firmName = screen.getByText('Color Test')
    
    expect(firmName).toHaveClass('text-main-text')
  })

  test('maintains typography classes', () => {
    render(<NavFirmName name="Typography Test" />)
    
    const firmName = screen.getByText('Typography Test')
    
    expect(firmName).toHaveClass('text-xl', 'font-semibold')
  })

  test('handles numeric characters', () => {
    render(<NavFirmName name="Company 123" />)
    
    const firmName = screen.getByText('Company 123')
    
    expect(firmName).toBeInTheDocument()
  })

  test('handles whitespace in names', () => {
    render(<NavFirmName name="  Spaced Company  " />)
    
    const firmName = screen.getByText(/Spaced Company/)
    
    expect(firmName).toBeInTheDocument()
    // Note: DOM normalizes whitespace, so we test for actual behavior
    expect(firmName).toHaveTextContent('Spaced Company')
  })
})