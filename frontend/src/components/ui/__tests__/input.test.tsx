import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { Input } from '../input'

describe('Input Component', () => {
  test('renders with default styling', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass(
      'flex', 'h-10', 'w-full', 'rounded-md', 'border', 'border-input',
      'bg-background', 'px-3', 'py-2', 'text-sm'
    )
  })

  test('handles value changes', async () => {
    const user = userEvent.setup()
    render(<Input placeholder="Type here" />)
    
    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
  })

  test('supports different input types', () => {
    const { rerender } = render(<Input type="email" placeholder="Email" />)
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" placeholder="Password" />)
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" placeholder="Number" />)
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number')

    rerender(<Input type="tel" placeholder="Phone" />)
    expect(screen.getByPlaceholderText('Phone')).toHaveAttribute('type', 'tel')

    rerender(<Input type="url" placeholder="Website" />)
    expect(screen.getByPlaceholderText('Website')).toHaveAttribute('type', 'url')
  })

  test('disabled state', async () => {
    const user = userEvent.setup()
    render(<Input disabled placeholder="Disabled input" />)
    
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50')
    
    await user.type(input, 'Should not work')
    expect(input).toHaveValue('')
  })

  test('ref forwarding', () => {
    const ref = jest.fn()
    render(<Input ref={ref} placeholder="Ref test" />)
    expect(ref).toHaveBeenCalled()
  })

  test('custom className application', () => {
    render(<Input className="custom-input-class" placeholder="Custom class" />)
    const input = screen.getByPlaceholderText('Custom class')
    expect(input).toHaveClass('custom-input-class')
    expect(input).toHaveClass('flex', 'h-10', 'w-full') // Still has default classes
  })

  test('handles HTML input attributes', () => {
    render(
      <Input
        placeholder="Full test"
        name="test-input"
        id="test-id"
        required
        maxLength={50}
        minLength={2}
        pattern="[a-zA-Z]+"
        autoComplete="off"
        data-testid="input-element"
      />
    )
    
    const input = screen.getByTestId('input-element')
    expect(input).toHaveAttribute('name', 'test-input')
    expect(input).toHaveAttribute('id', 'test-id')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('maxlength', '50')
    expect(input).toHaveAttribute('minlength', '2')
    expect(input).toHaveAttribute('pattern', '[a-zA-Z]+')
    expect(input).toHaveAttribute('autocomplete', 'off')
  })

  test('focus and blur events', async () => {
    const user = userEvent.setup()
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(
      <Input 
        placeholder="Focus test"
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    )
    
    const input = screen.getByPlaceholderText('Focus test')
    
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    expect(input).toHaveFocus()
    expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    
    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  test('onChange event handling', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input placeholder="Change test" onChange={handleChange} />)
    
    const input = screen.getByPlaceholderText('Change test')
    await user.type(input, 'test')
    
    expect(handleChange).toHaveBeenCalledTimes(4) // Called for each character
  })

  test('file input styling', () => {
    render(<Input type="file" data-testid="file-input" />)
    const input = screen.getByTestId('file-input')
    expect(input).toHaveClass(
      'file:border-0', 'file:bg-transparent', 'file:text-sm', 'file:font-medium'
    )
  })

  test('placeholder styling', () => {
    render(<Input placeholder="Placeholder test" />)
    const input = screen.getByPlaceholderText('Placeholder test')
    expect(input).toHaveClass('placeholder:text-muted-foreground')
  })

  test('controlled input', async () => {
    const user = userEvent.setup()
    const ControlledInput = () => {
      const [value, setValue] = React.useState('')
      return (
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Controlled"
        />
      )
    }
    
    render(<ControlledInput />)
    
    const input = screen.getByPlaceholderText('Controlled')
    await user.type(input, 'controlled value')
    
    expect(input).toHaveValue('controlled value')
  })
})