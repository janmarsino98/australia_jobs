import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Bookmark, X, Edit3, Bell, BellOff, Search } from "lucide-react";
import useSavedSearchesStore, { SavedSearch } from "../../stores/useSavedSearchesStore";

interface SavedSearchesProps {
    onSearchLoad: (filters: SavedSearch['filters']) => void;
    className?: string;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({ 
    onSearchLoad, 
    className = "" 
}) => {
    const { 
        getSavedSearches, 
        removeSavedSearch, 
        updateSavedSearch, 
        markAsUsed,
        toggleAlerts 
    } = useSavedSearchesStore();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");

    const savedSearches = getSavedSearches();

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

    const getFilterSummary = (filters: SavedSearch['filters']) => {
        const parts = [];
        if (filters.title) parts.push(`"${filters.title}"`);
        if (filters.location) parts.push(`in ${filters.location}`);
        if (filters.jobType && filters.jobType !== 'all') parts.push(filters.jobType);
        if (filters.experienceLevel && filters.experienceLevel !== 'all') parts.push(filters.experienceLevel);
        if (filters.salary?.min || filters.salary?.max) {
            const salaryRange = `$${filters.salary.min || 0} - $${filters.salary.max || '∞'}`;
            parts.push(salaryRange);
        }
        
        return parts.join(' • ') || 'All jobs';
    };

    const handleLoadSearch = (search: SavedSearch) => {
        onSearchLoad(search.filters);
        markAsUsed(search.id);
    };

    const handleEditStart = (search: SavedSearch) => {
        setEditingId(search.id);
        setEditingName(search.name);
    };

    const handleEditSave = () => {
        if (editingId && editingName.trim()) {
            updateSavedSearch(editingId, { name: editingName.trim() });
        }
        setEditingId(null);
        setEditingName("");
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleEditSave();
        } else if (e.key === 'Escape') {
            handleEditCancel();
        }
    };

    if (savedSearches.length === 0) {
        return null;
    }

    return (
        <Card className={className}>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                    <Bookmark className="w-5 h-5 mr-2" />
                    Saved Searches
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {savedSearches.map((search) => (
                    <div
                        key={search.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                {editingId === search.id ? (
                                    <div className="flex items-center space-x-2 mb-2">
                                        <input
                                            value={editingName}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            className="text-sm border rounded px-2 py-1 flex-1"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleEditSave}
                                            className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleEditCancel}
                                            className="h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium text-gray-900 truncate">
                                            {search.name}
                                        </h4>
                                        <button
                                            type="button"
                                            onClick={() => handleEditStart(search)}
                                            className="h-6 w-6 rounded hover:bg-gray-100 opacity-0 group-hover:opacity-100 flex items-center justify-center"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                                
                                <p className="text-xs text-gray-600 mb-2 truncate">
                                    {getFilterSummary(search.filters)}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <span>Created {formatTimeAgo(search.createdAt)}</span>
                                    {search.lastUsed && (
                                        <span>Used {formatTimeAgo(search.lastUsed)}</span>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 ml-2">
                                <button
                                    type="button"
                                    onClick={() => toggleAlerts(search.id)}
                                    className={`h-8 w-8 rounded hover:bg-gray-100 flex items-center justify-center ${
                                        search.alertsEnabled ? 'text-blue-500' : 'text-gray-400'
                                    }`}
                                    title={search.alertsEnabled ? 'Disable alerts' : 'Enable alerts'}
                                >
                                    {search.alertsEnabled ? 
                                        <Bell className="w-4 h-4" /> : 
                                        <BellOff className="w-4 h-4" />
                                    }
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => handleLoadSearch(search)}
                                    className="h-8 w-8 rounded hover:bg-gray-100 text-gray-600 hover:text-blue-500 flex items-center justify-center"
                                    title="Load search"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={() => removeSavedSearch(search.id)}
                                    className="h-8 w-8 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 flex items-center justify-center"
                                    title="Delete search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default SavedSearches; 