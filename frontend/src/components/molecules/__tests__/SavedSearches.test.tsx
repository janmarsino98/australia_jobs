import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SavedSearches from '../SavedSearches';

// Mock dependencies
const mockGetSavedSearches = jest.fn();
const mockRemoveSavedSearch = jest.fn();
const mockUpdateSavedSearch = jest.fn();
const mockMarkAsUsed = jest.fn();
const mockToggleAlerts = jest.fn();

jest.mock('../../../stores/useSavedSearchesStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getSavedSearches: mockGetSavedSearches,
    removeSavedSearch: mockRemoveSavedSearch,
    updateSavedSearch: mockUpdateSavedSearch,
    markAsUsed: mockMarkAsUsed,
    toggleAlerts: mockToggleAlerts,
  })),
}));

const defaultProps = {
  onSearchLoad: jest.fn(),
};

const mockSavedSearches = [
  {
    id: '1',
    name: 'Software Engineer Jobs',
    filters: {
      title: 'software engineer',
      location: 'Sydney',
      jobType: 'full-time',
      experienceLevel: 'mid-level',
      salary: { min: 80000, max: 120000 },
    },
    createdAt: Date.now() - 86400000, // 1 day ago
    lastUsed: Date.now() - 3600000, // 1 hour ago
    alertsEnabled: true,
  },
  {
    id: '2',
    name: 'Remote React Jobs',
    filters: {
      title: 'react developer',
      jobType: 'remote',
      experienceLevel: 'all',
    },
    createdAt: Date.now() - 172800000, // 2 days ago
    alertsEnabled: false,
  },
  {
    id: '3',
    name: 'All Jobs in Melbourne',
    filters: {
      location: 'Melbourne',
    },
    createdAt: Date.now() - 300000, // 5 minutes ago
    lastUsed: Date.now() - 60000, // 1 minute ago
    alertsEnabled: true,
  },
];

const renderComponent = (props = {}) => {
  return render(<SavedSearches {...defaultProps} {...props} />);
};

describe('SavedSearches', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when no saved searches exist', () => {
    mockGetSavedSearches.mockReturnValue([]);

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  test('renders saved searches when available', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    expect(screen.getByText('Saved Searches')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer Jobs')).toBeInTheDocument();
    expect(screen.getByText('Remote React Jobs')).toBeInTheDocument();
    expect(screen.getByText('All Jobs in Melbourne')).toBeInTheDocument();
  });

  test('displays filter summaries correctly', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    expect(screen.getByText('"software engineer" • in Sydney • full-time • mid-level • $80000 - $120000')).toBeInTheDocument();
    expect(screen.getByText('"react developer" • remote')).toBeInTheDocument();
    expect(screen.getByText('in Melbourne')).toBeInTheDocument();
  });

  test('formats time ago correctly', () => {
    const now = Date.now();
    const searches = [
      {
        id: '1',
        name: 'Just Now Search',
        filters: {},
        createdAt: now,
        lastUsed: now,
        alertsEnabled: false,
      },
      {
        id: '2',
        name: 'Minutes Ago Search',
        filters: {},
        createdAt: now - 300000, // 5 minutes
        lastUsed: now - 300000,
        alertsEnabled: false,
      },
      {
        id: '3',
        name: 'Hours Ago Search',
        filters: {},
        createdAt: now - 3600000, // 1 hour
        lastUsed: now - 3600000,
        alertsEnabled: false,
      },
      {
        id: '4',
        name: 'Days Ago Search',
        filters: {},
        createdAt: now - 86400000, // 1 day
        lastUsed: now - 86400000,
        alertsEnabled: false,
      },
    ];

    mockGetSavedSearches.mockReturnValue(searches);

    renderComponent();

    expect(screen.getByText('Created Just now')).toBeInTheDocument();
    expect(screen.getByText('Created 5m ago')).toBeInTheDocument();
    expect(screen.getByText('Created 1h ago')).toBeInTheDocument();
    expect(screen.getByText('Created 1d ago')).toBeInTheDocument();
  });

  test('displays last used time when available', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    expect(screen.getByText('Used 1h ago')).toBeInTheDocument();
    expect(screen.getByText('Used 1m ago')).toBeInTheDocument();
  });

  test('does not display last used time when not available', () => {
    const searchWithoutLastUsed = [{
      id: '1',
      name: 'Never Used Search',
      filters: {},
      createdAt: Date.now(),
      alertsEnabled: false,
    }];

    mockGetSavedSearches.mockReturnValue(searchWithoutLastUsed);

    renderComponent();

    expect(screen.queryByText(/Used/)).not.toBeInTheDocument();
  });

  test('handles search load', async () => {
    const mockOnSearchLoad = jest.fn();
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent({ onSearchLoad: mockOnSearchLoad });

    const loadButton = screen.getAllByTitle('Load search')[0];
    await user.click(loadButton);

    expect(mockOnSearchLoad).toHaveBeenCalledWith(mockSavedSearches[0].filters);
    expect(mockMarkAsUsed).toHaveBeenCalledWith('1');
  });

  test('handles search deletion', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const deleteButton = screen.getAllByTitle('Delete search')[0];
    await user.click(deleteButton);

    expect(mockRemoveSavedSearch).toHaveBeenCalledWith('1');
  });

  test('handles alert toggling', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const alertButton = screen.getAllByTitle('Disable alerts')[0];
    await user.click(alertButton);

    expect(mockToggleAlerts).toHaveBeenCalledWith('1');
  });

  test('displays correct alert button states', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    expect(screen.getByTitle('Disable alerts')).toBeInTheDocument();
    expect(screen.getByTitle('Enable alerts')).toBeInTheDocument();
  });

  test('starts editing search name', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    // Find edit button (should be visible on hover, but we'll click it directly)
    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    expect(screen.getByDisplayValue('Software Engineer Jobs')).toBeInTheDocument();
  });

  test('saves edited search name', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const input = screen.getByDisplayValue('Software Engineer Jobs');
    await user.clear(input);
    await user.type(input, 'Updated Search Name');

    const saveButton = screen.getByText('✓');
    await user.click(saveButton);

    expect(mockUpdateSavedSearch).toHaveBeenCalledWith('1', { name: 'Updated Search Name' });
  });

  test('cancels editing search name', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const cancelButton = screen.getByText('✕');
    await user.click(cancelButton);

    expect(mockUpdateSavedSearch).not.toHaveBeenCalled();
    expect(screen.getByText('Software Engineer Jobs')).toBeInTheDocument();
  });

  test('saves on Enter key press', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const input = screen.getByDisplayValue('Software Engineer Jobs');
    await user.clear(input);
    await user.type(input, 'New Name{Enter}');

    expect(mockUpdateSavedSearch).toHaveBeenCalledWith('1', { name: 'New Name' });
  });

  test('cancels on Escape key press', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const input = screen.getByDisplayValue('Software Engineer Jobs');
    await user.type(input, '{Escape}');

    expect(mockUpdateSavedSearch).not.toHaveBeenCalled();
  });

  test('does not save empty search name', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const input = screen.getByDisplayValue('Software Engineer Jobs');
    await user.clear(input);

    const saveButton = screen.getByText('✓');
    await user.click(saveButton);

    expect(mockUpdateSavedSearch).not.toHaveBeenCalled();
  });

  test('trims whitespace from search name', async () => {
    const user = userEvent.setup();

    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const searchContainer = screen.getByText('Software Engineer Jobs').closest('div')!;
    const editButton = searchContainer.querySelector('button[type="button"]') as HTMLElement;
    
    await user.click(editButton);

    const input = screen.getByDisplayValue('Software Engineer Jobs');
    await user.clear(input);
    await user.type(input, '  Trimmed Name  ');

    const saveButton = screen.getByText('✓');
    await user.click(saveButton);

    expect(mockUpdateSavedSearch).toHaveBeenCalledWith('1', { name: 'Trimmed Name' });
  });

  test('applies custom className', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    const { container } = renderComponent({ className: 'custom-class' });

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  test('displays "All jobs" for empty filters', () => {
    const emptyFiltersSearch = [{
      id: '1',
      name: 'Empty Search',
      filters: {},
      createdAt: Date.now(),
      alertsEnabled: false,
    }];

    mockGetSavedSearches.mockReturnValue(emptyFiltersSearch);

    renderComponent();

    expect(screen.getByText('All jobs')).toBeInTheDocument();
  });

  test('handles partial salary ranges in filter summary', () => {
    const partialSalarySearches = [
      {
        id: '1',
        name: 'Min Salary Only',
        filters: { salary: { min: 50000 } },
        createdAt: Date.now(),
        alertsEnabled: false,
      },
      {
        id: '2',
        name: 'Max Salary Only',
        filters: { salary: { max: 100000 } },
        createdAt: Date.now(),
        alertsEnabled: false,
      },
    ];

    mockGetSavedSearches.mockReturnValue(partialSalarySearches);

    renderComponent();

    expect(screen.getByText('$50000 - $∞')).toBeInTheDocument();
    expect(screen.getByText('$0 - $100000')).toBeInTheDocument();
  });

  test('truncates long search names', () => {
    const longNameSearch = [{
      id: '1',
      name: 'This is a very long search name that should be truncated when displayed',
      filters: {},
      createdAt: Date.now(),
      alertsEnabled: false,
    }];

    mockGetSavedSearches.mockReturnValue(longNameSearch);

    renderComponent();

    const nameElement = screen.getByText('This is a very long search name that should be truncated when displayed');
    expect(nameElement).toHaveClass('truncate');
  });

  test('displays saved searches icon in header', () => {
    mockGetSavedSearches.mockReturnValue(mockSavedSearches);

    renderComponent();

    const titleElement = screen.getByText('Saved Searches');
    const iconElement = titleElement.closest('.flex')!.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });
});