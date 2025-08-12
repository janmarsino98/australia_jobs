import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchHistory from '../SearchHistory';

// Mock dependencies
const mockGetRecentSearches = jest.fn();
const mockGetPopularSearches = jest.fn();
const mockRemoveSearch = jest.fn();
const mockClearHistory = jest.fn();

jest.mock('../../../stores/useSearchHistoryStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getRecentSearches: mockGetRecentSearches,
    getPopularSearches: mockGetPopularSearches,
    removeSearch: mockRemoveSearch,
    clearHistory: mockClearHistory,
  })),
}));

const defaultProps = {
  onSearchSelect: jest.fn(),
};

const mockRecentSearches = [
  {
    id: '1',
    query: 'software engineer',
    location: 'Sydney',
    timestamp: Date.now() - 3600000, // 1 hour ago
    resultsCount: 25,
  },
  {
    id: '2',
    query: 'data analyst',
    timestamp: Date.now() - 86400000, // 1 day ago
    resultsCount: 12,
  },
  {
    id: '3',
    query: '',
    location: 'Melbourne',
    timestamp: Date.now() - 300000, // 5 minutes ago
    resultsCount: 100,
  },
];

const mockPopularSearches = [
  'javascript developer',
  'python programmer',
  'ui designer',
];

const renderComponent = (props = {}) => {
  return render(<SearchHistory {...defaultProps} {...props} />);
};

describe('SearchHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when no searches exist', () => {
    mockGetRecentSearches.mockReturnValue([]);
    mockGetPopularSearches.mockReturnValue([]);

    const { container } = renderComponent();
    expect(container.firstChild).toBeNull();
  });

  test('renders recent searches when available', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('Search History')).toBeInTheDocument();
    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('software engineer')).toBeInTheDocument();
    expect(screen.getByText('data analyst')).toBeInTheDocument();
    expect(screen.getByText('All jobs')).toBeInTheDocument(); // empty query displays as "All jobs"
  });

  test('renders popular searches when available', () => {
    mockGetRecentSearches.mockReturnValue([]);
    mockGetPopularSearches.mockReturnValue(mockPopularSearches);

    renderComponent();

    expect(screen.getByText('Search History')).toBeInTheDocument();
    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
    expect(screen.getByText('javascript developer')).toBeInTheDocument();
    expect(screen.getByText('python programmer')).toBeInTheDocument();
    expect(screen.getByText('ui designer')).toBeInTheDocument();
  });

  test('renders both recent and popular searches', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue(mockPopularSearches);

    renderComponent();

    expect(screen.getByText('Recent Searches')).toBeInTheDocument();
    expect(screen.getByText('Popular Searches')).toBeInTheDocument();
  });

  test('displays location tags for searches with locations', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('Sydney')).toBeInTheDocument();
    expect(screen.getByText('Melbourne')).toBeInTheDocument();
  });

  test('displays results count when available', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('• 25 results')).toBeInTheDocument();
    expect(screen.getByText('• 12 results')).toBeInTheDocument();
    expect(screen.getByText('• 100 results')).toBeInTheDocument();
  });

  test('formats time ago correctly', () => {
    const now = Date.now();
    const searches = [
      {
        id: '1',
        query: 'just now',
        timestamp: now,
        resultsCount: 5,
      },
      {
        id: '2',
        query: 'minutes ago',
        timestamp: now - 300000, // 5 minutes
        resultsCount: 10,
      },
      {
        id: '3',
        query: 'hours ago',
        timestamp: now - 3600000, // 1 hour
        resultsCount: 15,
      },
      {
        id: '4',
        query: 'days ago',
        timestamp: now - 86400000, // 1 day
        resultsCount: 20,
      },
    ];

    mockGetRecentSearches.mockReturnValue(searches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('Just now')).toBeInTheDocument();
    expect(screen.getByText('5m ago')).toBeInTheDocument();
    expect(screen.getByText('1h ago')).toBeInTheDocument();
    expect(screen.getByText('1d ago')).toBeInTheDocument();
  });

  test('handles recent search click', async () => {
    const mockOnSearchSelect = jest.fn();
    const user = userEvent.setup();

    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent({ onSearchSelect: mockOnSearchSelect });

    const searchItem = screen.getByText('software engineer').closest('.cursor-pointer')!;
    await user.click(searchItem);

    expect(mockOnSearchSelect).toHaveBeenCalledWith('software engineer', 'Sydney');
  });

  test('handles popular search click', async () => {
    const mockOnSearchSelect = jest.fn();
    const user = userEvent.setup();

    mockGetRecentSearches.mockReturnValue([]);
    mockGetPopularSearches.mockReturnValue(mockPopularSearches);

    renderComponent({ onSearchSelect: mockOnSearchSelect });

    await user.click(screen.getByText('javascript developer'));

    expect(mockOnSearchSelect).toHaveBeenCalledWith('javascript developer');
  });

  test('handles individual search removal', async () => {
    const user = userEvent.setup();

    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    // Find the remove button for the first search (X icon)
    const searchItem = screen.getByText('software engineer').closest('.group')!;
    const removeButton = searchItem.querySelector('button[type="button"]:not(.cursor-pointer)') as HTMLElement;

    await user.click(removeButton);

    expect(mockRemoveSearch).toHaveBeenCalledWith('1');
  });

  test('prevents search selection when remove button is clicked', async () => {
    const mockOnSearchSelect = jest.fn();
    const user = userEvent.setup();

    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent({ onSearchSelect: mockOnSearchSelect });

    const searchItem = screen.getByText('software engineer').closest('.group')!;
    const removeButton = searchItem.querySelector('button[type="button"]:not(.cursor-pointer)') as HTMLElement;

    await user.click(removeButton);

    expect(mockRemoveSearch).toHaveBeenCalledWith('1');
    expect(mockOnSearchSelect).not.toHaveBeenCalled();
  });

  test('handles clear all history', async () => {
    const user = userEvent.setup();

    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    // Find the clear history button by looking for the button that contains the Trash2 icon
    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-500') && 
      button.className.includes('hover:text-red-500')
    );
    
    expect(clearButton).toBeTruthy();
    await user.click(clearButton!);

    expect(mockClearHistory).toHaveBeenCalled();
  });

  test('does not show clear button when no recent searches exist', () => {
    mockGetRecentSearches.mockReturnValue([]);
    mockGetPopularSearches.mockReturnValue(mockPopularSearches);

    renderComponent();

    const buttons = screen.getAllByRole('button');
    const clearButton = buttons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-gray-500') && 
      button.className.includes('hover:text-red-500')
    );
    
    expect(clearButton).toBeFalsy();
  });

  test('applies custom className', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    const { container } = renderComponent({ className: 'custom-class' });

    const cardElement = container.firstChild as HTMLElement;
    expect(cardElement).toHaveClass('custom-class');
  });

  test('calls getRecentSearches with limit of 5', () => {
    mockGetRecentSearches.mockReturnValue([]);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(mockGetRecentSearches).toHaveBeenCalledWith(5);
  });

  test('truncates long search queries', () => {
    const longQuery = 'This is a very long search query that should be truncated when displayed';
    const searchWithLongQuery = [{
      id: '1',
      query: longQuery,
      timestamp: Date.now(),
      resultsCount: 1,
    }];

    mockGetRecentSearches.mockReturnValue(searchWithLongQuery);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    const queryElement = screen.getByText(longQuery);
    expect(queryElement).toHaveClass('truncate');
  });

  test('shows hover effects on search items', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    const searchItem = screen.getByText('software engineer').closest('div')!;
    expect(searchItem).toHaveClass('hover:bg-gray-50');
  });

  test('handles search without results count', () => {
    const searchWithoutCount = [{
      id: '1',
      query: 'test search',
      timestamp: Date.now(),
    }];

    mockGetRecentSearches.mockReturnValue(searchWithoutCount);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('test search')).toBeInTheDocument();
    expect(screen.queryByText(/results/)).not.toBeInTheDocument();
  });

  test('handles empty query display as "All jobs"', () => {
    const emptyQuerySearch = [{
      id: '1',
      query: '',
      timestamp: Date.now(),
      resultsCount: 50,
    }];

    mockGetRecentSearches.mockReturnValue(emptyQuerySearch);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    expect(screen.getByText('All jobs')).toBeInTheDocument();
  });

  test('displays search history icon', () => {
    mockGetRecentSearches.mockReturnValue(mockRecentSearches);
    mockGetPopularSearches.mockReturnValue([]);

    renderComponent();

    const titleElement = screen.getByText('Search History');
    const iconElement = titleElement.closest('.flex')!.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });
});