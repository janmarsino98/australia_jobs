import React, { useEffect, useState } from 'react';
import { Save, RotateCcw, Bell, Mail, Smartphone } from 'lucide-react';
import { useNotificationStore, NotificationPreferences as NotificationPreferencesType } from '../../stores/useNotificationStore';
import httpClient from '../../httpClient';
import { cn } from '../../lib/utils';

interface NotificationPreferencesProps {
  className?: string;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({ className }) => {
  const {
    preferences,
    isLoading,
    error,
    fetchPreferences,
    updatePreferences,
    resetPreferences,
    clearError
  } = useNotificationStore();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferencesType>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState<Record<string, { name: string; description: string }>>({});

  useEffect(() => {
    fetchPreferences();
    
    // Fetch notification types for display
    fetchNotificationTypes();
  }, [fetchPreferences]);

  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const fetchNotificationTypes = async () => {
    try {
      const response = await httpClient.get('/notification-preferences/types');
      if (response.data.success) {
        setNotificationTypes(response.data.data.notification_types);
      }
    } catch (error) {
      console.error('Error fetching notification types:', error);
    }
  };

  const handlePreferenceChange = (type: string, channel: 'in_app' | 'email' | 'push', value: boolean) => {
    const newPreferences = {
      ...localPreferences,
      [type]: {
        ...localPreferences[type],
        [channel]: value
      }
    };
    
    setLocalPreferences(newPreferences);
    setHasChanges(JSON.stringify(newPreferences) !== JSON.stringify(preferences));
  };

  const handleSave = async () => {
    try {
      await updatePreferences(localPreferences);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetPreferences();
      setHasChanges(false);
    } catch (error) {
      console.error('Error resetting preferences:', error);
    }
  };


  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'in_app': return 'In-App';
      case 'email': return 'Email';
      case 'push': return 'Push';
      default: return channel;
    }
  };

  if (isLoading && Object.keys(localPreferences).length === 0) {
    return (
      <div className={cn("p-6 bg-white rounded-lg shadow", className)}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                  <div className="h-4 w-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 bg-white rounded-lg shadow", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
          <p className="text-sm text-gray-600 mt-1">
            Choose how you want to receive different types of notifications
          </p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </button>
          
          <button
            onClick={handleSave}
            disabled={!hasChanges || isLoading}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={clearError}
                  className="bg-red-50 text-red-800 text-sm font-medium px-2 py-1 rounded-md hover:bg-red-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4 py-3 px-4 bg-gray-50 rounded-lg font-medium text-sm text-gray-700">
          <div>Notification Type</div>
          <div className="flex items-center justify-center">
            <Bell className="h-4 w-4 mr-1" />
            In-App
          </div>
          <div className="flex items-center justify-center">
            <Mail className="h-4 w-4 mr-1" />
            Email
          </div>
          <div className="flex items-center justify-center">
            <Smartphone className="h-4 w-4 mr-1" />
            Push
          </div>
        </div>

        {Object.entries(localPreferences).map(([type, settings]) => {
          const typeInfo = notificationTypes[type] || { name: type, description: '' };
          
          return (
            <div key={type} className="grid grid-cols-4 gap-4 py-4 px-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex flex-col">
                <h3 className="font-medium text-gray-900">{typeInfo.name}</h3>
                {typeInfo.description && (
                  <p className="text-sm text-gray-600 mt-1">{typeInfo.description}</p>
                )}
              </div>
              
              {(['in_app', 'email', 'push'] as const).map((channel) => (
                <div key={channel} className="flex items-center justify-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings?.[channel] || false}
                      onChange={(e) => handlePreferenceChange(type, channel, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="sr-only">
                      {settings?.[channel] ? 'Disable' : 'Enable'} {getChannelLabel(channel)} notifications for {typeInfo.name}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {hasChanges && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Bell className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                You have unsaved changes
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Don't forget to save your notification preferences.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};