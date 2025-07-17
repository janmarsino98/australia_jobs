import React from 'react';
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Clock, X, Trash2 } from "lucide-react";
import useSearchHistoryStore, { SearchHistoryItem } from "../../stores/useSearchHistoryStore";

interface SearchHistoryProps {
    onSearchSelect: (query: string, location?: string) => void;
    className?: string;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ 
    onSearchSelect, 
    className = "" 
}) => {
    const { 
        getRecentSearches, 
        getPopularSearches, 
        removeSearch, 
        clearHistory 
    } = useSearchHistoryStore();

    const recentSearches = getRecentSearches(5);
    const popularSearches = getPopularSearches();

    const formatTimeAgo = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'Just now';
    };

    const handleSearchClick = (search: SearchHistoryItem) => {
        onSearchSelect(search.query, search.location);
    };

    const handleRemoveSearch = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
        e.stopPropagation();
        removeSearch(id);
    };

    if (recentSearches.length === 0 && popularSearches.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                        <Clock className="w-5 h-5 mr-2" />
                        Search History
                    </CardTitle>
                    {recentSearches.length > 0 && (
                        <button
                            type="button"
                            onClick={clearHistory}
                            className="text-gray-500 hover:text-red-500 p-2 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Searches</h4>
                        <div className="space-y-2">
                            {recentSearches.map((search) => (
                                <div
                                    key={search.id}
                                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
                                    onClick={() => handleSearchClick(search)}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {search.query || 'All jobs'}
                                            </span>
                                            {search.location && (
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    {search.location}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className="text-xs text-gray-400">
                                                {formatTimeAgo(search.timestamp)}
                                            </span>
                                            {search.resultsCount !== undefined && (
                                                <span className="text-xs text-gray-400">
                                                    • {search.resultsCount} results
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1 rounded"
                                        onClick={(e) => handleRemoveSearch(e, search.id)}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Popular Searches */}
                {popularSearches.length > 0 && (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Popular Searches</h4>
                        <div className="flex flex-wrap gap-2">
                            {popularSearches.map((query, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    className="inline-flex items-center px-2 py-1 rounded border border-gray-300 text-xs bg-white hover:bg-gray-50 transition-colors"
                                    onClick={() => onSearchSelect(query)}
                                >
                                    {query}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SearchHistory; 