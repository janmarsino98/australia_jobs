import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import SearchBox from '../SearchBox';

// Mock dependencies
jest.mock('../../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`)
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
}));

jest.mock('../../../stores/useSearchHistoryStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    searches: [
      { query: 'software engineer', timestamp: Date.now() - 86400000, resultsCount: 10 },
      { query: 'react developer', timestamp: Date.now() - 172800000, resultsCount: 5 },
    ],
    addSearch: jest.fn(),
  })),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockNavigate = jest.fn();

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <SearchBox {...props} />
    </BrowserRouter>
  );
};

describe('SearchBox', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { useNavigate } = require('react-router-dom');
    useNavigate.mockReturnValue(mockNavigate);
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        suggestions: [
          { type: 'title', value: 'Software Engineer', count: 25 },
          { type: 'company', value: 'Google', count: 12 },
          { type: 'location', value: 'Sydney', count: 50 },
        ]
      })
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders search input with correct placeholder', () => {
    renderComponent();
    
    const searchInput = screen.getByPlaceholderText('Search for jobs by title, keyword, company, or location');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('aria-label', 'Search for jobs');
  });

  test('handles search input changes', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software');
    
    expect(searchInput).toHaveValue('software');
  });

  test('submits search on enter keypress', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();
    renderComponent({ onSearch: mockOnSearch });
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software engineer');
    await user.keyboard('{Enter}');
    
    expect(mockOnSearch).toHaveBeenCalledWith('software engineer');
  });

  test('submits search on button click', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();
    renderComponent({ onSearch: mockOnSearch });
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'react developer');
    
    const searchButton = screen.getByRole('button', { name: 'Search' });
    await user.click(searchButton);
    
    expect(mockOnSearch).toHaveBeenCalledWith('react developer');
  });

  test('navigates to jobs page when no onSearch prop provided', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'developer');
    
    const searchButton = screen.getByRole('button', { name: 'Search' });
    await user.click(searchButton);
    
    expect(mockNavigate).toHaveBeenCalledWith('/jobs?q=developer');
  });

  test('displays autocomplete suggestions on focus', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Searches')).toBeInTheDocument();
      expect(screen.getByText('software engineer')).toBeInTheDocument();
      expect(screen.getByText('react developer')).toBeInTheDocument();
    });
  });

  test('shows loading state during search', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 's');
    await user.click(searchInput);
    
    // Should show loading state initially
    await waitFor(() => {
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  test('displays API suggestions when available', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Sydney')).toBeInTheDocument();
    });
  });

  test('handles suggestion click', async () => {
    const mockOnSearch = jest.fn();
    const user = userEvent.setup();
    renderComponent({ onSearch: mockOnSearch });
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'soft');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Software Engineer'));
    
    expect(mockOnSearch).toHaveBeenCalledWith('Software Engineer');
    expect(searchInput).toHaveValue('Software Engineer');
  });

  test('clears search input when clear button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'test query');
    
    const clearButton = screen.getByRole('button', { name: /clear search/i });
    await user.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  test('handles keyboard navigation through suggestions', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    // Test Arrow Down navigation
    await user.keyboard('{ArrowDown}');
    
    // First suggestion should be highlighted (we can't test visual highlight but can test functionality)
    await user.keyboard('{Enter}');
    
    expect(searchInput).toHaveValue('Software Engineer');
  });

  test('handles escape key to close suggestions', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    await user.keyboard('{Escape}');
    
    // Suggestions should be closed (we test by checking if they're not visible)
    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });

  test('disables search button when input is empty', () => {
    renderComponent();
    
    const searchButton = screen.getByRole('button', { name: 'Search' });
    expect(searchButton).toBeDisabled();
  });

  test('enables search button when input has value', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    const searchButton = screen.getByRole('button', { name: 'Search' });
    
    await user.type(searchInput, 'test');
    
    expect(searchButton).not.toBeDisabled();
  });

  test('displays "no suggestions found" message when API returns empty results', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ suggestions: [] })
    });
    
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'nonexistent');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('No suggestions found for "nonexistent"')).toBeInTheDocument();
    });
  });

  test('falls back to local search history when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'soft');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('software engineer')).toBeInTheDocument();
    });
  });

  test('applies default value when provided', () => {
    renderComponent({ defaultValue: 'initial search' });
    
    const searchInput = screen.getByRole('searchbox');
    expect(searchInput).toHaveValue('initial search');
  });

  test('shows advanced search filter button when showAdvancedSearch is true', () => {
    renderComponent({ showAdvancedSearch: true });
    
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-searchbar-text')
    );
    expect(filterButton).toBeInTheDocument();
  });

  test('does not show advanced search filter button by default', () => {
    renderComponent();
    
    const buttons = screen.getAllByRole('button');
    const filterButton = buttons.find(button => 
      button.querySelector('svg') && 
      button.className.includes('text-searchbar-text')
    );
    expect(filterButton).toBeUndefined();
  });

  test('closes suggestions when clicking outside', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const searchInput = screen.getByRole('searchbox');
    await user.type(searchInput, 'software');
    await user.click(searchInput);
    
    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
    
    // Click outside the search box
    await user.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
    });
  });
});