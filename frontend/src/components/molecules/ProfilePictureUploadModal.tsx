import React, { useState, useRef } from 'react';
import { Camera, Upload, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../ui/use-toast';
import useAuthStore from '../../stores/useAuthStore';

interface ProfilePictureUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfilePicture?: string;
}

const ProfilePictureUploadModal: React.FC<ProfilePictureUploadModalProps> = ({
  isOpen,
  onClose,
  currentProfilePicture
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('profileImage', selectedFile);

      const response = await fetch('http://localhost:5000/users/profile/image', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (response.ok) {
        const updatedUserData = await response.json();
        
        // Transform backend response to User type
        const updatedUser = {
          id: updatedUserData._id,
          email: updatedUserData.email,
          name: updatedUserData.name,
          role: updatedUserData.role,
          email_verified: updatedUserData.email_verified,
          profile: updatedUserData.profile,
          oauth_accounts: updatedUserData.oauth_accounts,
          created_at: updatedUserData.created_at,
          last_login: updatedUserData.last_login,
          is_active: updatedUserData.is_active,
          profileImage: updatedUserData.profileImage
        };
        
        // Update the auth store with new profile image
        useAuthStore.getState().setUser(updatedUser);
        
        toast({
          title: "Profile Picture Updated",
          description: "Your profile picture has been updated successfully.",
        });

        // Clean up and close modal
        handleClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to upload image' }));
        throw new Error(errorData.error || 'Failed to upload profile picture');
      }
    } catch (error) {
      console.error("Failed to upload profile picture:", error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload profile picture');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Clean up preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setIsUploading(false);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Update Profile Picture
          </DialogTitle>
          <DialogDescription>
            {currentProfilePicture 
              ? "Uploading a new picture will replace your current profile picture permanently."
              : "Choose a new profile picture to personalize your profile."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Warning Alert */}
          {currentProfilePicture && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                Your current profile picture will be permanently deleted and cannot be recovered.
              </AlertDescription>
            </Alert>
          )}

          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Button or Preview */}
          <div className="flex flex-col items-center space-y-4">
            {previewUrl ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-32 w-32 rounded-full object-cover border-2 border-gray-200"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleButtonClick}
                  className="w-full"
                >
                  Choose Different Image
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleButtonClick}
                className="h-32 w-32 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 flex flex-col items-center justify-center gap-2"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <span className="text-sm text-gray-600">Select Image</span>
              </Button>
            )}
          </div>

          {/* Error Display */}
          {uploadError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {uploadError}
              </AlertDescription>
            </Alert>
          )}

          {/* File Requirements */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Requirements:</p>
            <ul className="list-disc list-inside text-xs space-y-1">
              <li>File formats: JPEG, PNG, GIF, WEBP</li>
              <li>Maximum file size: 5MB</li>
              <li>Recommended size: 800x800 pixels</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="min-w-[100px]"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureUploadModal;