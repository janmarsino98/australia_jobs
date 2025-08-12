import { render, screen, fireEvent } from '@testing-library/react'
import NavIconImg from '../NavIconImg'

describe('NavIconImg', () => {
  const defaultProps = {
    img_url: 'https://example.com/logo.png',
    alt: 'Company logo'
  }

  beforeEach(() => {
    // Mock console.error to avoid noise in tests when testing error scenarios
    jest.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders image correctly', () => {
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/logo.png')
    expect(image).toHaveAttribute('alt', 'Company logo')
  })

  test('handles alt text properly', () => {
    render(<NavIconImg {...defaultProps} alt="Different alt text" />)
    
    const image = screen.getByAltText('Different alt text')
    
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Different alt text')
  })

  test('handles different image URLs', () => {
    render(<NavIconImg {...defaultProps} img_url="https://different.com/image.jpg" />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveAttribute('src', 'https://different.com/image.jpg')
  })

  test('has proper styling classes', () => {
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveClass(
      'h-12',
      'w-auto',
      'object-contain',
      'transition-opacity',
      'duration-200',
      'group-hover:opacity-80'
    )
  })

  test('handles image loading events', () => {
    const onLoad = jest.fn()
    
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    image.onload = onLoad
    
    // Simulate image load
    fireEvent.load(image)
    
    expect(onLoad).toHaveBeenCalled()
  })

  test('handles image error events', () => {
    const onError = jest.fn()
    
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    image.onerror = onError
    
    // Simulate image error
    fireEvent.error(image)
    
    expect(onError).toHaveBeenCalled()
  })

  test('renders with empty alt text', () => {
    render(<NavIconImg {...defaultProps} alt="" />)
    
    const image = screen.getByRole('img')
    
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', '')
  })

  test('renders with empty image URL', () => {
    render(<NavIconImg {...defaultProps} img_url="" />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveAttribute('src', '')
  })

  test('maintains aspect ratio with object-contain', () => {
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveClass('object-contain')
    expect(image).toHaveClass('h-12', 'w-auto')
  })

  test('has hover opacity transition', () => {
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveClass('group-hover:opacity-80')
    expect(image).toHaveClass('transition-opacity', 'duration-200')
  })

  test('handles special characters in alt text', () => {
    render(<NavIconImg {...defaultProps} alt="Company & Co. <Logo>" />)
    
    const image = screen.getByAltText('Company & Co. <Logo>')
    
    expect(image).toBeInTheDocument()
  })

  test('handles data URLs', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    
    render(<NavIconImg {...defaultProps} img_url={dataUrl} />)
    
    const image = screen.getByAltText('Company logo')
    
    expect(image).toHaveAttribute('src', dataUrl)
  })

  test('is accessible with proper img role', () => {
    render(<NavIconImg {...defaultProps} />)
    
    const image = screen.getByRole('img')
    
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('alt', 'Company logo')
  })
})