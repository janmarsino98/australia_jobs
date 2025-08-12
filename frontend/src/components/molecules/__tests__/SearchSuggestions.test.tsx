import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchSuggestions from '../SearchSuggestions';

// Mock dependencies
jest.mock('../../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

jest.mock('../../../config', () => ({
  buildApiUrl: jest.fn((path) => `http://localhost:5000${path}`)
}));

const mockHttpClient = require('../../../httpClient').default;

const defaultProps = {
  query: 'software',
  onSuggestionSelect: jest.fn(),
  onClose: jest.fn(),
  type: 'title' as const,
};

const renderComponent = (props = {}) => {
  return render(<SearchSuggestions {...defaultProps} {...props} />);
};

describe('SearchSuggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders nothing when query is less than 2 characters', () => {
    const { container } = renderComponent({ query: 's' });
    expect(container.firstChild).toBeNull();
  });

  test('renders nothing when query is empty', () => {
    const { container } = renderComponent({ query: '' });
    expect(container.firstChild).toBeNull();
  });

  test('displays loading state while fetching suggestions', async () => {
    // Mock a delayed response
    mockHttpClient.get.mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({ data: [] }), 100)
      )
    );

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Loading suggestions...')).toBeInTheDocument();
    });
  });

  test('displays API suggestions when available', async () => {
    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
      { value: 'Software Developer', type: 'title', count: 15 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.getByText('Software Developer')).toBeInTheDocument();
      expect(screen.getByText('25 jobs')).toBeInTheDocument();
      expect(screen.getByText('15 jobs')).toBeInTheDocument();
    });
  });

  test('displays mock suggestions when API fails', async () => {
    mockHttpClient.get.mockRejectedValue(new Error('API Error'));

    renderComponent({ query: 'engineer' });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });
  });

  test('handles suggestion selection for title type', async () => {
    const mockOnSuggestionSelect = jest.fn();
    const mockOnClose = jest.fn();
    const user = userEvent.setup();

    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent({
      onSuggestionSelect: mockOnSuggestionSelect,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Software Engineer'));

    expect(mockOnSuggestionSelect).toHaveBeenCalledWith('Software Engineer');
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('handles suggestion selection for location type', async () => {
    const mockOnSuggestionSelect = jest.fn();
    const mockOnClose = jest.fn();
    const user = userEvent.setup();

    const mockSuggestions = [
      { value: 'Sydney', type: 'location', count: 50 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent({
      type: 'location',
      query: 'syd',
      onSuggestionSelect: mockOnSuggestionSelect,
      onClose: mockOnClose,
    });

    await waitFor(() => {
      expect(screen.getByText('Sydney')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Sydney'));

    expect(mockOnSuggestionSelect).toHaveBeenCalledWith('Sydney');
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays correct icons for different suggestion types', async () => {
    const titleSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: titleSuggestions });

    const { rerender } = renderComponent();

    await waitFor(() => {
      const titleIcon = screen.getByText('Software Engineer').closest('button')?.querySelector('svg');
      expect(titleIcon).toBeInTheDocument();
    });

    // Test location type
    const locationSuggestions = [
      { value: 'Sydney', type: 'location', count: 50 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: locationSuggestions });

    rerender(<SearchSuggestions {...defaultProps} type="location" query="syd" />);

    await waitFor(() => {
      const locationIcon = screen.getByText('Sydney').closest('button')?.querySelector('svg');
      expect(locationIcon).toBeInTheDocument();
    });
  });

  test('displays job count with correct pluralization', async () => {
    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 1 },
      { value: 'Developer', type: 'title', count: 25 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('1 job')).toBeInTheDocument(); // singular
      expect(screen.getByText('25 jobs')).toBeInTheDocument(); // plural
    });
  });

  test('does not display job count when not provided', async () => {
    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title' }, // no count
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
      expect(screen.queryByText(/job/)).not.toBeInTheDocument();
    });
  });

  test('closes suggestions when clicking outside', async () => {
    const mockOnClose = jest.fn();
    const user = userEvent.setup();

    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent({ onClose: mockOnClose });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    // Click outside the suggestions container
    await user.click(document.body);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('applies custom className when provided', async () => {
    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    const { container } = renderComponent({ className: 'custom-class' });

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const suggestionsContainer = container.firstChild as HTMLElement;
    expect(suggestionsContainer).toHaveClass('custom-class');
  });

  test('fetches suggestions with correct API endpoint for titles', async () => {
    mockHttpClient.get.mockResolvedValue({ data: [] });

    renderComponent({ type: 'title', query: 'engineer' });

    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'http://localhost:5000/jobs/suggestions/titles?q=engineer'
      );
    });
  });

  test('fetches suggestions with correct API endpoint for locations', async () => {
    mockHttpClient.get.mockResolvedValue({ data: [] });

    renderComponent({ type: 'location', query: 'sydney' });

    await waitFor(() => {
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        'http://localhost:5000/jobs/suggestions/locations?q=sydney'
      );
    });
  });

  test('handles keyboard focus on suggestion buttons', async () => {
    const user = userEvent.setup();
    const mockSuggestions = [
      { value: 'Software Engineer', type: 'title', count: 25 },
      { value: 'Software Developer', type: 'title', count: 15 },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    });

    const firstButton = screen.getByText('Software Engineer').closest('button')!;
    firstButton.focus();

    expect(firstButton).toHaveFocus();

    // Test tab navigation to next suggestion
    await user.tab();
    const secondButton = screen.getByText('Software Developer').closest('button')!;
    expect(secondButton).toHaveFocus();
  });

  test('truncates long suggestion values', async () => {
    const mockSuggestions = [
      { 
        value: 'This is a very long job title that should be truncated when displayed', 
        type: 'title', 
        count: 5 
      },
    ];

    mockHttpClient.get.mockResolvedValue({ data: mockSuggestions });

    renderComponent();

    await waitFor(() => {
      const suggestionElement = screen.getByText('This is a very long job title that should be truncated when displayed');
      expect(suggestionElement).toHaveClass('truncate');
    });
  });

  test('debounces API calls when query changes rapidly', async () => {
    const { rerender } = renderComponent({ query: 'so' });

    // Change query multiple times rapidly
    rerender(<SearchSuggestions {...defaultProps} query="sof" />);
    rerender(<SearchSuggestions {...defaultProps} query="soft" />);
    rerender(<SearchSuggestions {...defaultProps} query="softw" />);

    // Wait for debounce timeout
    await waitFor(() => {
      // Should only make one API call after debounce
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });
  });

  test('renders nothing when suggestions array is empty', async () => {
    mockHttpClient.get.mockResolvedValue({ data: [] });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});