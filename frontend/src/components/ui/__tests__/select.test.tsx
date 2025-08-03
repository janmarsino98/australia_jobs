import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectLabel,
  SelectSeparator,
  SelectGroup,
} from '../select'

const TestSelect = ({ disabled = false, onValueChange = jest.fn() }) => (
  <Select disabled={disabled} onValueChange={onValueChange}>
    <SelectTrigger>
      <SelectValue placeholder="Select an option" />
    </SelectTrigger>
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Fruits</SelectLabel>
        <SelectItem value="apple">Apple</SelectItem>
        <SelectItem value="banana">Banana</SelectItem>
        <SelectSeparator />
        <SelectItem value="orange">Orange</SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
)

describe('Select Component', () => {
  test('renders select trigger with placeholder', () => {
    render(<TestSelect />)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText('Select an option')).toBeInTheDocument()
  })

  test('opens dropdown when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    expect(screen.getByText('Fruits')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.getByText('Orange')).toBeInTheDocument()
  })

  test('selects option when clicked', async () => {
    const user = userEvent.setup()
    const onValueChange = jest.fn()
    render(<TestSelect onValueChange={onValueChange} />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    const appleOption = screen.getByText('Apple')
    await user.click(appleOption)
    
    expect(onValueChange).toHaveBeenCalledWith('apple')
  })

  test('shows selected value in trigger', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    const bananaOption = screen.getByText('Banana')
    await user.click(bananaOption)
    
    expect(screen.getByText('Banana')).toBeInTheDocument()
    expect(screen.queryByText('Select an option')).not.toBeInTheDocument()
  })

  test('disabled state prevents interaction', async () => {
    const user = userEvent.setup()
    const onValueChange = jest.fn()
    render(<TestSelect disabled onValueChange={onValueChange} />)
    
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveAttribute('aria-disabled', 'true')
    
    await user.click(trigger)
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.queryByText('Fruits')).not.toBeInTheDocument()
  })

  test('keyboard navigation works', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    // Navigate with arrow keys
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{Enter}')
    
    // Should select the second option (Banana)
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  test('escape key closes dropdown', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    expect(screen.getByText('Fruits')).toBeInTheDocument()
    
    await user.keyboard('{Escape}')
    
    expect(screen.queryByText('Fruits')).not.toBeInTheDocument()
  })

  test('custom trigger styling', () => {
    render(
      <Select>
        <SelectTrigger className="custom-trigger">
          <SelectValue placeholder="Custom trigger" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    )
    
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveClass('custom-trigger')
    expect(trigger).toHaveClass('flex', 'h-10', 'w-full', 'items-center', 'justify-between')
  })

  test('shows chevron down icon', () => {
    render(<TestSelect />)
    const chevronIcon = screen.getByRole('combobox').querySelector('svg')
    expect(chevronIcon).toBeInTheDocument()
  })

  test('select item has proper styling and behavior', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    const appleItem = screen.getByText('Apple')
    expect(appleItem).toHaveClass(
      'relative', 'flex', 'w-full', 'cursor-default', 'select-none',
      'items-center', 'rounded-sm'
    )
  })

  test('select label displays correctly', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    const label = screen.getByText('Fruits')
    expect(label).toHaveClass('py-1.5', 'pl-8', 'pr-2', 'text-sm', 'font-semibold')
  })

  test('select separator renders', async () => {
    const user = userEvent.setup()
    render(<TestSelect />)
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    // Check that separator is present between items
    const separator = screen.getByRole('separator')
    expect(separator).toBeInTheDocument()
    expect(separator).toHaveClass('-mx-1', 'my-1', 'h-px', 'bg-muted')
  })

  test('controlled select with value prop', () => {
    render(
      <Select value="banana">
        <SelectTrigger>
          <SelectValue placeholder="Select fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
        </SelectContent>
      </Select>
    )
    
    expect(screen.getByText('Banana')).toBeInTheDocument()
  })

  test('ref forwarding on trigger', () => {
    const ref = jest.fn()
    render(
      <Select>
        <SelectTrigger ref={ref}>
          <SelectValue placeholder="Ref test" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    )
    
    expect(ref).toHaveBeenCalled()
  })

  test('focus styles applied correctly', () => {
    render(<TestSelect />)
    const trigger = screen.getByRole('combobox')
    expect(trigger).toHaveClass(
      'focus:outline-none', 'focus:ring-2', 'focus:ring-ring', 'focus:ring-offset-2'
    )
  })

  test('handles content positioning', async () => {
    const user = userEvent.setup()
    render(
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Position test" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectItem value="test">Test</SelectItem>
        </SelectContent>
      </Select>
    )
    
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})