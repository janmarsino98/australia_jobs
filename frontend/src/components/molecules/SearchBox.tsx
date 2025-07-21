import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Clock, X, MapPin, Building } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import { buildApiUrl } from "../../config";
import useSearchHistoryStore from "../../stores/useSearchHistoryStore";

interface SearchBoxProps {
  onSearch?: (query: string) => void;
  showAdvancedSearch?: boolean;
  defaultValue?: string;
}

interface SearchSuggestion {
  type: 'history' | 'title' | 'company' | 'location';
  value: string;
  timestamp?: number;
  count?: number;
}

interface SearchHistoryItem {
  query: string;
  timestamp: number;
  filters: Record<string, any>;
  resultsCount: number;
}

const SearchBox: React.FC<SearchBoxProps> = ({ 
  onSearch, 
  showAdvancedSearch = false, 
  defaultValue = "" 
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState<string>(defaultValue);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { searches, addSearch } = useSearchHistoryStore();

  // Fetch search suggestions from API
  const fetchSearchSuggestions = async (searchQuery: string): Promise<SearchSuggestion[]> => {
    try {
      if (!searchQuery.trim()) {
        // Return recent searches when no query
        return searches.slice(0, 5).map(search => ({
          type: 'history' as const,
          value: search.query,
          timestamp: search.timestamp
        }));
      }

      const response = await fetch(buildApiUrl('/search/suggestions'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          query: searchQuery.trim(),
          limit: 8 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
      
      // Fallback to local search history
      return searches
        .filter(search => 
          search.query.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
        .map(search => ({
          type: 'history' as const,
          value: search.query,
          timestamp: search.timestamp
        }));
    }
  };

  // Handle input change with debouncing and API calls
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const newSuggestions = await fetchSearchSuggestions(query);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searches]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSuggestionClick(suggestions[highlightedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.value);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    
    // Perform search with selected suggestion
    performSearch(suggestion.value);
  };

  const handleSearch = () => {
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const performSearch = (searchQuery: string) => {
    // Add to search history
    addSearch({
      query: searchQuery,
      timestamp: Date.now(),
      filters: {},
      resultsCount: 0
    });

    // Call parent onSearch callback or navigate
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/jobs?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'title':
        return <Search className="w-4 h-4" />;
      case 'company':
        return <Building className="w-4 h-4" />;
      case 'location':
        return <MapPin className="w-4 h-4" />;
      case 'history':
        return <Clock className="w-4 h-4" />;
      default:
        return <Search className="w-4 h-4" />;
    }
  };

  const highlightMatch = (text: string, query: string): string => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="flex flex-row rounded-lg items-center bg-dark-white shadow-lg h-[48px] my-[12px] border border-gray-200 focus-within:border-pill-text focus-within:ring-2 focus-within:ring-pill-text/20">
        <div className="text-searchbar-text h-full px-4 flex items-center">
          <Search className="w-5 h-5" />
        </div>
        
        <div className="flex-1 h-full">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for jobs by title, keyword, company, or location"
            className="text-searchbar-text text-[16px] outline-none bg-transparent w-full h-full"
            aria-label="Search for jobs"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center space-x-2 px-3">
          {query && (
            <button
              onClick={clearSearch}
              className="text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {showAdvancedSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(true)}
              className="text-searchbar-text hover:bg-gray-100"
            >
              <Filter className="w-4 h-4" />
            </Button>
          )}
          
          <Button
            onClick={handleSearch}
            size="sm"
            className="bg-pill-text hover:bg-pill-text/90"
            disabled={!query.trim()}
          >
            Search
          </Button>
        </div>
      </div>

      {/* Auto-complete Suggestions */}
      {showSuggestions && (query.length > 0 || searches.length > 0) && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 shadow-lg border border-gray-200">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-searchbar-text">
                <div className="inline-flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pill-text mr-2"></div>
                  Searching...
                </div>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {query.length === 0 && (
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                    Recent Searches
                  </div>
                )}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0 ${
                      index === highlightedIndex ? 'bg-pill-bg' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400">
                        {getSuggestionIcon(suggestion.type)}
                      </div>
                      <div>
                        <div 
                          className="text-sm font-medium text-gray-900"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightMatch(suggestion.value, query) 
                          }}
                        />
                        {suggestion.type !== 'history' && (
                          <div className="text-xs text-gray-500 capitalize">
                            {suggestion.type} • {suggestion.count} jobs
                          </div>
                        )}
                        {suggestion.type === 'history' && suggestion.timestamp && (
                          <div className="text-xs text-gray-500">
                            {new Date(suggestion.timestamp).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.length > 0 ? (
              <div className="p-4 text-center text-searchbar-text">
                No suggestions found for "{query}"
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchBox;