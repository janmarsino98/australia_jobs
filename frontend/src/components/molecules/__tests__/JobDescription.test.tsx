import { render, screen } from '@testing-library/react'
import { JobDescription } from '../JobDescription'

const mockDescription = {
  introduction: 'We are looking for a talented software developer to join our growing team.',
  requirements: [
    '3+ years of JavaScript experience',
    'Experience with React and Node.js',
    'Strong problem-solving skills'
  ],
  responsibilities: [
    'Develop and maintain web applications',
    'Collaborate with cross-functional teams',
    'Write clean, maintainable code'
  ],
  benefits: [
    'Competitive salary',
    'Health insurance',
    'Flexible working hours',
    'Remote work options'
  ],
  closingStatement: 'If you are passionate about technology and want to make an impact, we would love to hear from you!'
}

const renderComponent = (description = mockDescription) => {
  return render(<JobDescription description={description} />)
}

describe('JobDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders card with job description title', () => {
    renderComponent()

    expect(screen.getByText('Job Description')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Job Description' })).toBeInTheDocument()
  })

  test('displays introduction text', () => {
    renderComponent()

    expect(screen.getByText(mockDescription.introduction)).toBeInTheDocument()
  })

  test('displays closing statement', () => {
    renderComponent()

    expect(screen.getByText(mockDescription.closingStatement)).toBeInTheDocument()
  })

  test('renders requirements section with heading', () => {
    renderComponent()

    expect(screen.getByText('Requirements')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Requirements' })).toBeInTheDocument()
  })

  test('displays all requirement items as list', () => {
    renderComponent()

    mockDescription.requirements.forEach(requirement => {
      expect(screen.getByText(requirement)).toBeInTheDocument()
    })

    const requirementItems = screen.getAllByRole('listitem')
    
    // Should include requirements, responsibilities, and benefits lists
    expect(requirementItems.length).toBeGreaterThanOrEqual(mockDescription.requirements.length)
  })

  test('renders responsibilities section with heading', () => {
    renderComponent()

    expect(screen.getByText('Responsibilities')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Responsibilities' })).toBeInTheDocument()
  })

  test('displays all responsibility items as list', () => {
    renderComponent()

    mockDescription.responsibilities.forEach(responsibility => {
      expect(screen.getByText(responsibility)).toBeInTheDocument()
    })
  })

  test('renders benefits section with heading', () => {
    renderComponent()

    expect(screen.getByText('Benefits')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Benefits' })).toBeInTheDocument()
  })

  test('displays all benefit items as list', () => {
    renderComponent()

    mockDescription.benefits.forEach(benefit => {
      expect(screen.getByText(benefit)).toBeInTheDocument()
    })
  })

  test('all lists have correct ARIA attributes', () => {
    renderComponent()

    const lists = screen.getAllByRole('list')
    
    lists.forEach(list => {
      expect(list).toHaveAttribute('role', 'list')
      expect(list).toHaveClass('list-disc', 'pl-5', 'space-y-1')
    })
  })

  test('renders with empty arrays', () => {
    const emptyDescription = {
      introduction: 'Test introduction',
      requirements: [],
      responsibilities: [],
      benefits: [],
      closingStatement: 'Test closing'
    }

    renderComponent(emptyDescription)

    expect(screen.getByText('Requirements')).toBeInTheDocument()
    expect(screen.getByText('Responsibilities')).toBeInTheDocument()
    expect(screen.getByText('Benefits')).toBeInTheDocument()
    expect(screen.getByText('Test introduction')).toBeInTheDocument()
    expect(screen.getByText('Test closing')).toBeInTheDocument()
  })

  test('handles single item arrays', () => {
    const singleItemDescription = {
      introduction: 'Single item test',
      requirements: ['Only one requirement'],
      responsibilities: ['Only one responsibility'],
      benefits: ['Only one benefit'],
      closingStatement: 'Single item closing'
    }

    renderComponent(singleItemDescription)

    expect(screen.getByText('Only one requirement')).toBeInTheDocument()
    expect(screen.getByText('Only one responsibility')).toBeInTheDocument()
    expect(screen.getByText('Only one benefit')).toBeInTheDocument()
  })

  test('has correct card structure', () => {
    renderComponent()

    const mainHeading = screen.getByRole('heading', { name: 'Job Description' })
    expect(mainHeading).toBeInTheDocument()
    
    // The card should have the proper structure
    const cardContent = screen.getByText(mockDescription.introduction).closest('div')
    expect(cardContent).toBeInTheDocument()
  })

  test('sections have proper semantic structure', () => {
    renderComponent()

    // Check that sections are properly structured
    const requirementsSection = screen.getByText('Requirements').closest('section')
    const responsibilitiesSection = screen.getByText('Responsibilities').closest('section')
    const benefitsSection = screen.getByText('Benefits').closest('section')

    expect(requirementsSection).toBeInTheDocument()
    expect(responsibilitiesSection).toBeInTheDocument()
    expect(benefitsSection).toBeInTheDocument()
  })

  test('section headings have correct styling', () => {
    renderComponent()

    const headings = [
      screen.getByText('Requirements'),
      screen.getByText('Responsibilities'),
      screen.getByText('Benefits')
    ]

    headings.forEach(heading => {
      expect(heading).toHaveClass('font-semibold', 'text-lg', 'mb-2')
    })
  })

  test('list items have correct styling', () => {
    renderComponent()

    const listItems = screen.getAllByRole('listitem')
    
    listItems.forEach(item => {
      expect(item).toHaveClass('text-gray-700')
    })
  })

  test('introduction and closing text have correct styling', () => {
    renderComponent()

    const introText = screen.getByText(mockDescription.introduction)
    const closingText = screen.getByText(mockDescription.closingStatement)

    expect(introText).toHaveClass('text-gray-700')
    expect(closingText).toHaveClass('text-gray-700', 'mt-4')
  })

  test('renders with long content', () => {
    const longDescription = {
      introduction: 'A'.repeat(500),
      requirements: Array.from({ length: 10 }, (_, i) => `Requirement ${i + 1} with very long text that goes on and on`),
      responsibilities: Array.from({ length: 15 }, (_, i) => `Responsibility ${i + 1} with extensive details`),
      benefits: Array.from({ length: 8 }, (_, i) => `Benefit ${i + 1} with comprehensive description`),
      closingStatement: 'B'.repeat(300)
    }

    renderComponent(longDescription)

    expect(screen.getByText(longDescription.introduction)).toBeInTheDocument()
    expect(screen.getByText(longDescription.closingStatement)).toBeInTheDocument()
    expect(screen.getByText('Requirement 1 with very long text that goes on and on')).toBeInTheDocument()
    expect(screen.getByText('Benefit 8 with comprehensive description')).toBeInTheDocument()
  })

  test('maintains accessibility with screen readers', () => {
    renderComponent()

    // Check that headings are properly structured for screen readers
    const mainHeading = screen.getByRole('heading', { name: 'Job Description' })
    const subHeadings = [
      screen.getByRole('heading', { name: 'Requirements' }),
      screen.getByRole('heading', { name: 'Responsibilities' }),
      screen.getByRole('heading', { name: 'Benefits' })
    ]

    expect(mainHeading.tagName).toBe('H2')
    subHeadings.forEach(heading => {
      expect(heading.tagName).toBe('H3')
    })
  })

  test('renders with HTML entities and special characters', () => {
    const specialCharDescription = {
      introduction: 'We need someone with <strong>5+ years</strong> & expertise in C++/C#',
      requirements: [
        'Must have 3+ years experience',
        'Knowledge of HTML/CSS & JavaScript',
        'Experience with SQL Server 2019+'
      ],
      responsibilities: [
        'Develop & maintain applications',
        'Write documentation (API/User guides)'
      ],
      benefits: [
        '$80,000 - $120,000 salary',
        '401(k) & health benefits'
      ],
      closingStatement: 'Ready to join our team? Apply today!'
    }

    renderComponent(specialCharDescription)

    expect(screen.getByText('We need someone with <strong>5+ years</strong> & expertise in C++/C#')).toBeInTheDocument()
    expect(screen.getByText('$80,000 - $120,000 salary')).toBeInTheDocument()
  })
})