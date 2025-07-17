import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Briefcase } from 'lucide-react';
import httpClient from '../../httpClient';

interface Suggestion {
  value: string;
  type: 'title' | 'location' | 'company';
  count?: number;
}

interface SearchSuggestionsProps {
  query: string;
  onSuggestionSelect: (suggestion: string) => void;
  onClose: () => void;
  type: 'title' | 'location';
  className?: string;
}

export const SearchSuggestions: React.FC<SearchSuggestionsProps> = ({
  query,
  onSuggestionSelect,
  onClose,
  type,
  className = ''
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        let endpoint = '';
        if (type === 'title') {
          endpoint = `http://localhost:5000/jobs/suggestions/titles?q=${encodeURIComponent(query)}`;
        } else {
          endpoint = `http://localhost:5000/jobs/suggestions/locations?q=${encodeURIComponent(query)}`;
        }

        const response = await httpClient.get(endpoint);
        setSuggestions(response.data);
      } catch (error) {
        // If the API endpoint doesn't exist yet, provide some mock suggestions
        const mockSuggestions = getMockSuggestions(query, type);
        setSuggestions(mockSuggestions);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, type]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getMockSuggestions = (query: string, type: 'title' | 'location'): Suggestion[] => {
    if (type === 'title') {
      const jobTitles = [
        'Software Engineer', 'Data Analyst', 'Marketing Specialist', 'Sales Representative',
        'Customer Service', 'Accountant', 'Nurse', 'Teacher', 'Project Manager',
        'Business Analyst', 'Developer', 'Designer', 'Manager', 'Assistant',
        'Coordinator', 'Specialist', 'Consultant', 'Administrator'
      ];
      
      return jobTitles
        .filter(title => title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map(title => ({
          value: title,
          type: 'title',
          count: Math.floor(Math.random() * 50) + 1
        }));
    } else {
      const locations = [
        'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra',
        'Gold Coast', 'Newcastle', 'Wollongong', 'Geelong', 'Hobart', 'Darwin',
        'Cairns', 'Townsville', 'Ballarat', 'Bendigo', 'Albury', 'Mackay'
      ];
      
      return locations
        .filter(location => location.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
        .map(location => ({
          value: location,
          type: 'location',
          count: Math.floor(Math.random() * 100) + 10
        }));
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSuggestionSelect(suggestion.value);
    onClose();
  };

  const getIcon = (suggestionType: string) => {
    switch (suggestionType) {
      case 'title':
        return <Briefcase className="w-4 h-4 text-gray-400" />;
      case 'location':
        return <MapPin className="w-4 h-4 text-gray-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!query || query.length < 2 || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      ref={suggestionsRef}
      className={`absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-64 overflow-y-auto ${className}`}
    >
      {isLoading ? (
        <div className="p-3 text-sm text-gray-500 text-center">
          Loading suggestions...
        </div>
      ) : (
        <div className="py-1">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-3 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center space-x-3">
                {getIcon(suggestion.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {suggestion.value}
                  </div>
                  {suggestion.count && (
                    <div className="text-xs text-gray-500">
                      {suggestion.count} job{suggestion.count !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions; 