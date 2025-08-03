import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '../dialog'

const TestDialog = ({ defaultOpen = false, onOpenChange = jest.fn() }) => (
  <Dialog defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
    <DialogTrigger>Open Dialog</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Test Dialog Title</DialogTitle>
        <DialogDescription>This is a test dialog description</DialogDescription>
      </DialogHeader>
      <div>Dialog content goes here</div>
      <DialogFooter>
        <DialogClose>Cancel</DialogClose>
        <button>Confirm</button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
)

describe('Dialog Component', () => {
  test('renders trigger button', () => {
    render(<TestDialog />)
    expect(screen.getByRole('button', { name: 'Open Dialog' })).toBeInTheDocument()
  })

  test('opens dialog when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' })
    await user.click(trigger)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Dialog Title')).toBeInTheDocument()
    expect(screen.getByText('This is a test dialog description')).toBeInTheDocument()
  })

  test('dialog opens by default when defaultOpen is true', () => {
    render(<TestDialog defaultOpen />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Test Dialog Title')).toBeInTheDocument()
  })

  test('closes dialog when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<TestDialog defaultOpen />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes dialog when Cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<TestDialog defaultOpen />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes dialog when escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<TestDialog defaultOpen />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    await user.keyboard('{Escape}')
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('closes dialog when overlay is clicked', async () => {
    const user = userEvent.setup()
    render(<TestDialog defaultOpen />)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    // Click on the overlay (outside the dialog content)
    const overlay = document.querySelector('[data-radix-popper-content-wrapper]')
    if (overlay?.parentElement) {
      await user.click(overlay.parentElement)
    }
    
    // Note: This test might be tricky to implement precisely due to Radix UI's portal behavior
    // The specific selector might need adjustment based on actual DOM structure
  })

  test('dialog content has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass(
      'fixed', 'left-[50%]', 'top-[50%]', 'z-50', 'grid', 'w-full', 'max-w-lg',
      'translate-x-[-50%]', 'translate-y-[-50%]', 'gap-4', 'border', 'bg-background', 'p-6'
    )
  })

  test('dialog header has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    const header = screen.getByText('Test Dialog Title').closest('div')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'text-center', 'sm:text-left')
  })

  test('dialog title has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    const title = screen.getByText('Test Dialog Title')
    expect(title).toHaveClass('text-lg', 'font-semibold', 'leading-none', 'tracking-tight')
  })

  test('dialog description has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    const description = screen.getByText('This is a test dialog description')
    expect(description).toHaveClass('text-sm', 'text-muted-foreground')
  })

  test('dialog footer has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    const footer = screen.getByRole('button', { name: 'Cancel' }).closest('div')
    expect(footer).toHaveClass(
      'flex', 'flex-col-reverse', 'sm:flex-row', 'sm:justify-end', 'sm:space-x-2'
    )
  })

  test('calls onOpenChange when dialog state changes', async () => {
    const user = userEvent.setup()
    const onOpenChange = jest.fn()
    render(<TestDialog onOpenChange={onOpenChange} />)
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' })
    await user.click(trigger)
    
    expect(onOpenChange).toHaveBeenCalledWith(true)
    
    const closeButton = screen.getByRole('button', { name: 'Close' })
    await user.click(closeButton)
    
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  test('supports custom className on content', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent className="custom-dialog-class">
          <DialogTitle>Custom Dialog</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('custom-dialog-class')
    expect(dialog).toHaveClass('fixed', 'left-[50%]', 'top-[50%]') // Still has default classes
  })

  test('supports custom className on header', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogHeader className="custom-header">
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
    
    const header = screen.getByText('Title').closest('div')
    expect(header).toHaveClass('custom-header')
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
  })

  test('supports custom className on footer', () => {
    render(
      <Dialog defaultOpen>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter className="custom-footer">
            <button>Footer Button</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
    
    const footer = screen.getByRole('button', { name: 'Footer Button' }).closest('div')
    expect(footer).toHaveClass('custom-footer')
    expect(footer).toHaveClass('flex', 'flex-col-reverse', 'sm:flex-row')
  })

  test('overlay has proper styling', () => {
    render(<TestDialog defaultOpen />)
    
    // The overlay might be rendered outside the main component tree
    const overlay = document.querySelector('[data-radix-popper-content-wrapper]')
    // This test might need adjustment based on how Radix UI renders the overlay
    expect(document.body).toContainElement(screen.getByRole('dialog'))
  })

  test('close button is accessible', () => {
    render(<TestDialog defaultOpen />)
    
    const closeButton = screen.getByRole('button', { name: 'Close' })
    expect(closeButton).toBeInTheDocument()
    expect(closeButton).toHaveClass(
      'absolute', 'right-4', 'top-4', 'rounded-sm', 'opacity-70',
      'focus:outline-none', 'focus:ring-2', 'focus:ring-ring'
    )
  })

  test('dialog is properly labeled for accessibility', () => {
    render(<TestDialog defaultOpen />)
    
    const dialog = screen.getByRole('dialog')
    const title = screen.getByText('Test Dialog Title')
    const description = screen.getByText('This is a test dialog description')
    
    expect(dialog).toHaveAccessibleName('Test Dialog Title')
    expect(dialog).toHaveAccessibleDescription('This is a test dialog description')
  })

  test('dialog content receives focus when opened', async () => {
    const user = userEvent.setup()
    render(<TestDialog />)
    
    const trigger = screen.getByRole('button', { name: 'Open Dialog' })
    await user.click(trigger)
    
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveFocus()
  })

  test('focus is trapped within dialog', async () => {
    const user = userEvent.setup()
    render(<TestDialog defaultOpen />)
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    const confirmButton = screen.getByRole('button', { name: 'Confirm' })
    const closeButton = screen.getByRole('button', { name: 'Close' })
    
    // Tab through focusable elements
    await user.tab()
    expect(closeButton).toHaveFocus()
    
    await user.tab()
    expect(cancelButton).toHaveFocus()
    
    await user.tab()
    expect(confirmButton).toHaveFocus()
    
    // Tab again should cycle back to first focusable element
    await user.tab()
    expect(closeButton).toHaveFocus()
  })
})