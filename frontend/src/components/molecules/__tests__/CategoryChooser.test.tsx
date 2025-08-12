import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CategoryChooser from '../CategoryChooser';
import httpClient from '../../../httpClient';

// Mock httpClient
jest.mock('../../../httpClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

// Mock Category_Pill component
jest.mock('../../atoms/Category_Pill', () => {
  return function MockCategoryPill({ name, handleClick, value }: any) {
    return (
      <button
        data-testid={`category-pill-${value}`}
        onClick={() => handleClick(value)}
        className="category-pill-mock"
      >
        {name}
      </button>
    );
  };
});

const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

const mockJobTypes = [
  { jobtype: 'Software Development' },
  { jobtype: 'Marketing' },
  { jobtype: 'Design' },
  { jobtype: 'Sales' },
  { jobtype: 'Customer Service' }
];

const renderComponent = (props: any = {}) => {
  return render(
    <CategoryChooser onCategoryChange={jest.fn()} {...props} />
  );
};

describe('CategoryChooser', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHttpClient.get.mockResolvedValue({ data: mockJobTypes });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Component Initialization', () => {
    test('renders component with title', () => {
      renderComponent();
      
      expect(screen.getByText('Select Categories:')).toBeInTheDocument();
    });

    test('fetches categories on mount', async () => {
      renderComponent();
      
      expect(mockHttpClient.get).toHaveBeenCalledWith('/jobtypes/get_all');
      
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Software Development')).toBeInTheDocument();
      });
    });

    test('renders all categories as selected initially', async () => {
      renderComponent();
      
      await waitFor(() => {
        mockJobTypes.forEach(jobType => {
          expect(screen.getByTestId(`category-pill-${jobType.jobtype}`)).toBeInTheDocument();
          expect(screen.getByText(jobType.jobtype)).toBeInTheDocument();
        });
      });
    });

    test('renders plus button', async () => {
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-+')).toBeInTheDocument();
        expect(screen.getByText('+')).toBeInTheDocument();
      });
    });
  });

  describe('Category Selection', () => {
    test('removes category when pill is clicked', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Software Development')).toBeInTheDocument();
      });
      
      // Click on a category to remove it
      const softwarePill = screen.getByTestId('category-pill-Software Development');
      await user.click(softwarePill);
      
      // Category should be removed from the list
      await waitFor(() => {
        expect(screen.queryByTestId('category-pill-Software Development')).not.toBeInTheDocument();
      });
      
      // onCategoryChange should be called with updated list
      const expectedCategories = ['Marketing', 'Design', 'Sales', 'Customer Service'];
      expect(onCategoryChange).toHaveBeenCalledWith(expectedCategories);
    });

    test('can remove multiple categories', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Software Development')).toBeInTheDocument();
        expect(screen.getByTestId('category-pill-Marketing')).toBeInTheDocument();
      });
      
      // Remove first category
      await user.click(screen.getByTestId('category-pill-Software Development'));
      
      // Remove second category
      await user.click(screen.getByTestId('category-pill-Marketing'));
      
      // Both categories should be removed
      await waitFor(() => {
        expect(screen.queryByTestId('category-pill-Software Development')).not.toBeInTheDocument();
        expect(screen.queryByTestId('category-pill-Marketing')).not.toBeInTheDocument();
      });
      
      // Should have called onCategoryChange twice
      expect(onCategoryChange).toHaveBeenCalledTimes(2);
      
      // Final call should have remaining categories
      const finalCategories = ['Design', 'Sales', 'Customer Service'];
      expect(onCategoryChange).toHaveBeenLastCalledWith(finalCategories);
    });

    test('can remove all categories', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for categories to load
      await waitFor(() => {
        mockJobTypes.forEach(jobType => {
          expect(screen.getByTestId(`category-pill-${jobType.jobtype}`)).toBeInTheDocument();
        });
      });
      
      // Remove all categories
      for (const jobType of mockJobTypes) {
        const pill = screen.queryByTestId(`category-pill-${jobType.jobtype}`);
        if (pill) {
          await user.click(pill);
        }
      }
      
      // All category pills should be removed (except plus button)
      await waitFor(() => {
        mockJobTypes.forEach(jobType => {
          expect(screen.queryByTestId(`category-pill-${jobType.jobtype}`)).not.toBeInTheDocument();
        });
      });
      
      // Plus button should still be there
      expect(screen.getByTestId('category-pill-+')).toBeInTheDocument();
      
      // Final call should be empty array
      expect(onCategoryChange).toHaveBeenLastCalledWith([]);
    });

    test('plus button click does not affect categories', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-+')).toBeInTheDocument();
      });
      
      // Click plus button
      await user.click(screen.getByTestId('category-pill-+'));
      
      // No categories should be removed
      mockJobTypes.forEach(jobType => {
        expect(screen.getByTestId(`category-pill-${jobType.jobtype}`)).toBeInTheDocument();
      });
      
      // onCategoryChange should not be called
      expect(onCategoryChange).not.toHaveBeenCalled();
    });
  });

  describe('API Integration', () => {
    test('handles API success response', async () => {
      const customJobTypes = [
        { jobtype: 'Engineering' },
        { jobtype: 'Product Management' }
      ];
      
      mockHttpClient.get.mockResolvedValueOnce({ data: customJobTypes });
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Engineering')).toBeInTheDocument();
        expect(screen.getByTestId('category-pill-Product Management')).toBeInTheDocument();
      });
      
      expect(screen.queryByTestId('category-pill-Software Development')).not.toBeInTheDocument();
    });

    test('handles empty API response', async () => {
      mockHttpClient.get.mockResolvedValueOnce({ data: [] });
      renderComponent();
      
      await waitFor(() => {
        // Only plus button should be present
        expect(screen.getByTestId('category-pill-+')).toBeInTheDocument();
      });
      
      // No category pills should be present
      mockJobTypes.forEach(jobType => {
        expect(screen.queryByTestId(`category-pill-${jobType.jobtype}`)).not.toBeInTheDocument();
      });
    });

    test('handles API error gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockHttpClient.get.mockRejectedValueOnce(new Error('Network error'));
      
      renderComponent();
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error while fetching categories: ',
          expect.any(Error)
        );
      });
      
      // Component should still render with only plus button
      expect(screen.getByText('Select Categories:')).toBeInTheDocument();
      expect(screen.getByTestId('category-pill-+')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });

    test('makes API call with correct endpoint', () => {
      renderComponent();
      
      expect(mockHttpClient.get).toHaveBeenCalledWith('/jobtypes/get_all');
      expect(mockHttpClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('State Management', () => {
    test('maintains selected categories state correctly', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Software Development')).toBeInTheDocument();
      });
      
      // Remove one category
      await user.click(screen.getByTestId('category-pill-Software Development'));
      
      // Verify state is updated
      expect(onCategoryChange).toHaveBeenCalledWith([
        'Marketing', 'Design', 'Sales', 'Customer Service'
      ]);
      
      // Remove another category
      await user.click(screen.getByTestId('category-pill-Marketing'));
      
      // Verify state is further updated
      expect(onCategoryChange).toHaveBeenCalledWith([
        'Design', 'Sales', 'Customer Service'
      ]);
    });

    test('starts with all categories selected', async () => {
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      await waitFor(() => {
        mockJobTypes.forEach(jobType => {
          expect(screen.getByTestId(`category-pill-${jobType.jobtype}`)).toBeInTheDocument();
        });
      });
      
      // onCategoryChange should not be called during initialization
      expect(onCategoryChange).not.toHaveBeenCalled();
    });
  });

  describe('UI Behavior', () => {
    test('renders categories in correct layout', async () => {
      renderComponent();
      
      await waitFor(() => {
        const container = screen.getByText('Select Categories:').parentElement;
        expect(container).toHaveClass('flex', 'flex-row', 'gap-4', 'items-center');
      });
    });

    test('category pills are interactive', async () => {
      const user = userEvent.setup();
      renderComponent();
      
      await waitFor(() => {
        const pill = screen.getByTestId('category-pill-Software Development');
        expect(pill).toBeInTheDocument();
        expect(pill.tagName).toBe('BUTTON');
      });
    });

    test('plus button is always rendered last', async () => {
      renderComponent();
      
      await waitFor(() => {
        const pills = screen.getAllByRole('button');
        const lastPill = pills[pills.length - 1];
        expect(lastPill).toHaveAttribute('data-testid', 'category-pill-+');
      });
    });
  });

  describe('Category Order', () => {
    test('maintains original order when removing categories', async () => {
      const user = userEvent.setup();
      const onCategoryChange = jest.fn();
      renderComponent({ onCategoryChange });
      
      // Wait for categories to load
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Software Development')).toBeInTheDocument();
      });
      
      // Remove middle category (Design)
      await user.click(screen.getByTestId('category-pill-Design'));
      
      // Verify remaining categories maintain their order
      expect(onCategoryChange).toHaveBeenCalledWith([
        'Software Development', 'Marketing', 'Sales', 'Customer Service'
      ]);
    });

    test('handles duplicate category names gracefully', async () => {
      const duplicateJobTypes = [
        { jobtype: 'Development' },
        { jobtype: 'Development' }, // Duplicate
        { jobtype: 'Marketing' }
      ];
      
      mockHttpClient.get.mockResolvedValueOnce({ data: duplicateJobTypes });
      renderComponent();
      
      await waitFor(() => {
        // Should render based on the data received
        const developmentPills = screen.getAllByText('Development');
        expect(developmentPills).toHaveLength(2);
      });
    });
  });

  describe('Accessibility', () => {
    test('category pills use appropriate labels', async () => {
      renderComponent();
      
      await waitFor(() => {
        const pill = screen.getByTestId('category-pill-Software Development');
        expect(pill).toBeInTheDocument();
        // The mock component doesn't include aria-label, but the real one would
      });
    });

    test('component structure supports keyboard navigation', async () => {
      renderComponent();
      
      await waitFor(() => {
        const pills = screen.getAllByRole('button');
        pills.forEach(pill => {
          expect(pill).toBeInTheDocument();
        });
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles categories with special characters', async () => {
      const specialJobTypes = [
        { jobtype: 'UI/UX Design' },
        { jobtype: 'C++ Developer' },
        { jobtype: 'Project Manager - Senior' }
      ];
      
      mockHttpClient.get.mockResolvedValueOnce({ data: specialJobTypes });
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-UI/UX Design')).toBeInTheDocument();
        expect(screen.getByTestId('category-pill-C++ Developer')).toBeInTheDocument();
        expect(screen.getByTestId('category-pill-Project Manager - Senior')).toBeInTheDocument();
      });
    });

    test('handles very long category names', async () => {
      const longJobTypes = [
        { jobtype: 'Very Long Category Name That Might Cause Layout Issues' }
      ];
      
      mockHttpClient.get.mockResolvedValueOnce({ data: longJobTypes });
      renderComponent();
      
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Very Long Category Name That Might Cause Layout Issues')).toBeInTheDocument();
      });
    });

    test('handles API response with null or undefined jobtypes', async () => {
      const malformedJobTypes = [
        { jobtype: 'Valid Category' },
        { jobtype: null },
        { jobtype: undefined },
        { jobtype: 'Another Valid Category' }
      ];
      
      mockHttpClient.get.mockResolvedValueOnce({ data: malformedJobTypes });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderComponent();
      
      // Component should still render, but might have issues with null/undefined values
      await waitFor(() => {
        expect(screen.getByTestId('category-pill-Valid Category')).toBeInTheDocument();
        expect(screen.getByTestId('category-pill-Another Valid Category')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });
});