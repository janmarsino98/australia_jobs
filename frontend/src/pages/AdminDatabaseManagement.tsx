import React, { useState, useEffect } from 'react';
import { AlertTriangle, Database, Trash2, Users, BarChart3, Shield, User } from 'lucide-react';
import useAdminStore, { DatabaseOperationResult } from '../stores/useAdminStore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useToast } from '../components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';

const AdminDatabaseManagement: React.FC = () => {
  const {
    users,
    databaseSummary,
    isLoading,
    error,
    fetchUsers,
    fetchDatabaseSummary,
    clearAllUsers,
    clearSpecificUser,
    clearError
  } = useAdminStore();

  const { toast } = useToast();
  
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showClearUserDialog, setShowClearUserDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [confirmationText, setConfirmationText] = useState('');
  const [operationResult, setOperationResult] = useState<DatabaseOperationResult | null>(null);

  useEffect(() => {
    fetchDatabaseSummary();
    fetchUsers(1, 100); // Fetch more users for selection
  }, []);

  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        variant: 'destructive'
      });
      clearError();
    }
  }, [error]);

  const handleClearAllUsers = async () => {
    if (confirmationText !== 'DELETE ALL USERS') {
      toast({
        title: 'Confirmation Required',
        description: 'Please type "DELETE ALL USERS" to confirm this action',
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await clearAllUsers();
      setOperationResult(result);
      setShowClearAllDialog(false);
      setConfirmationText('');
      
      toast({
        title: 'Success',
        description: `All users cleared successfully. ${result.total_deleted} items deleted.`,
        variant: 'default'
      });
      
      // Refresh summary
      fetchDatabaseSummary();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear all users',
        variant: 'destructive'
      });
    }
  };

  const handleClearSpecificUser = async () => {
    if (!selectedUserId) {
      toast({
        title: 'User Required',
        description: 'Please select a user to delete',
        variant: 'destructive'
      });
      return;
    }

    if (confirmationText !== `DELETE USER ${selectedUserId}`) {
      toast({
        title: 'Confirmation Required',
        description: `Please type "DELETE USER ${selectedUserId}" to confirm this action`,
        variant: 'destructive'
      });
      return;
    }

    try {
      const result = await clearSpecificUser(selectedUserId);
      setOperationResult(result);
      setShowClearUserDialog(false);
      setConfirmationText('');
      setSelectedUserId('');
      
      toast({
        title: 'Success',
        description: `User cleared successfully. ${result.total_deleted} items deleted.`,
        variant: 'default'
      });
      
      // Refresh data
      fetchDatabaseSummary();
      fetchUsers(1, 100);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear user',
        variant: 'destructive'
      });
    }
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Database Management</h1>
        </div>
        
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Danger Zone</AlertTitle>
          <AlertDescription className="text-red-700">
            These operations are <strong>irreversible</strong> and will permanently delete user data.
            Use with extreme caution and ensure you have proper backups.
          </AlertDescription>
        </Alert>
      </div>

      {/* Database Summary */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Database Summary
            </CardTitle>
            <CardDescription>
              Current state of user-related data in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && !databaseSummary ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading database summary...</span>
              </div>
            ) : databaseSummary ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(databaseSummary.total_users)}
                  </div>
                  <div className="text-sm text-gray-600">Total Users</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(databaseSummary.job_applications)}
                  </div>
                  <div className="text-sm text-gray-600">Job Applications</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatNumber(databaseSummary.saved_jobs)}
                  </div>
                  <div className="text-sm text-gray-600">Saved Jobs</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNumber(databaseSummary.gridfs_files)}
                  </div>
                  <div className="text-sm text-gray-600">Resume Files</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-teal-600">
                    {formatNumber(databaseSummary.user_preferences)}
                  </div>
                  <div className="text-sm text-gray-600">User Preferences</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">
                    {formatNumber(databaseSummary.user_experience)}
                  </div>
                  <div className="text-sm text-gray-600">Experience Records</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600">
                    {formatNumber(databaseSummary.user_education)}
                  </div>
                  <div className="text-sm text-gray-600">Education Records</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatNumber(databaseSummary.resume_metadata)}
                  </div>
                  <div className="text-sm text-gray-600">Resume Metadata</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Failed to load database summary
              </div>
            )}
            
            {databaseSummary?.users_by_role && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 mb-2">Users by Role</h4>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(databaseSummary.users_by_role).map(([role, count]) => (
                    <Badge key={role} variant="secondary">
                      {role}: {formatNumber(count)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <Button 
              onClick={fetchDatabaseSummary}
              variant="outline"
              size="sm"
              className="mt-4"
              disabled={isLoading}
            >
              Refresh Summary
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Operation Results */}
      {operationResult && (
        <div className="mb-8">
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="text-green-800">Operation Completed</CardTitle>
              <CardDescription className="text-green-700">
                {operationResult.message} at {formatDate(operationResult.timestamp)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(operationResult.deleted_collections).map(([collection, count]) => (
                  <div key={collection} className="flex justify-between">
                    <span className="text-green-700">{collection}:</span>
                    <span className="font-medium text-green-800">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex justify-between font-bold text-green-800">
                  <span>Total Deleted:</span>
                  <span>{formatNumber(operationResult.total_deleted)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Destructive Operations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Clear All Users */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              Clear All Users
            </CardTitle>
            <CardDescription>
              Permanently delete all users and their associated data from the database.
              This includes resumes, applications, preferences, and all user-generated content.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  This action cannot be undone. All user data will be permanently lost.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => setShowClearAllDialog(true)}
                variant="destructive"
                className="w-full"
                disabled={isLoading}
              >
                <Database className="h-4 w-4 mr-2" />
                Clear All Users
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Clear Specific User */}
        <Card className="border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <User className="h-5 w-5" />
              Clear Specific User
            </CardTitle>
            <CardDescription>
              Permanently delete a specific user and all their associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-700">
                  This will delete the user and all their data permanently.
                </AlertDescription>
              </Alert>
              
              <Button
                onClick={() => setShowClearUserDialog(true)}
                variant="outline"
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                disabled={isLoading}
              >
                <User className="h-4 w-4 mr-2" />
                Clear Specific User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clear All Users Dialog */}
      <Dialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-red-800">Confirm Clear All Users</DialogTitle>
            <DialogDescription>
              This action will permanently delete <strong>ALL USERS</strong> and their associated data.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                You are about to delete {databaseSummary?.total_users || 0} users and all their data.
              </AlertDescription>
            </Alert>
            
            <div>
              <label htmlFor="confirm-all" className="block text-sm font-medium text-gray-700 mb-1">
                Type <code className="bg-gray-100 px-1 rounded">DELETE ALL USERS</code> to confirm:
              </label>
              <Input
                id="confirm-all"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="DELETE ALL USERS"
                className="mt-1"
                autoFocus
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClearAllDialog(false);
                setConfirmationText('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearAllUsers}
              disabled={isLoading || confirmationText !== 'DELETE ALL USERS'}
            >
              {isLoading ? 'Deleting...' : 'Delete All Users'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear Specific User Dialog */}
      <Dialog open={showClearUserDialog} onOpenChange={setShowClearUserDialog}>
        <DialogContent className="max-w-md" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-orange-800">Clear Specific User</DialogTitle>
            <DialogDescription>
              Select a user to permanently delete along with all their associated data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select User:
              </label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a user to delete" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedUserId && (
              <>
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-700">
                    This will permanently delete the selected user and all their data.
                  </AlertDescription>
                </Alert>
                
                <div>
                  <label htmlFor="confirm-user" className="block text-sm font-medium text-gray-700 mb-1">
                    Type <code className="bg-gray-100 px-1 rounded">DELETE USER {selectedUserId}</code> to confirm:
                  </label>
                  <Input
                    id="confirm-user"
                    value={confirmationText}
                    onChange={(e) => setConfirmationText(e.target.value)}
                    placeholder={`DELETE USER ${selectedUserId}`}
                    className="mt-1"
                  />
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowClearUserDialog(false);
                setConfirmationText('');
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearSpecificUser}
              disabled={isLoading || !selectedUserId || confirmationText !== `DELETE USER ${selectedUserId}`}
            >
              {isLoading ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDatabaseManagement;