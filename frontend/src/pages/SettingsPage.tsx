import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import FormInput from "../components/molecules/FormInput";
import { useToast } from "../components/ui/use-toast";
import useAuthStore from "../stores/useAuthStore";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Shield,
  Bell,
  Trash2,
  AlertTriangle,
  Save,
  Settings,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import * as z from "zod";
import httpClient from "../httpClient";
import config from "../config";

// Validation schemas
const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .regex(/^\+?61\d{9}$/, "Please enter a valid Australian phone number")
    .optional()
    .or(z.literal(""))
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const SettingsPage = () => {
  const { user, checkSession } = useAuthStore();
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile settings state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.profile?.phone || ""
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true,
    applicationUpdates: true,
    marketingEmails: false
  });
  
  // Privacy settings state
  const [privacy, setPrivacy] = useState({
    profileVisible: true,
    allowRecruiters: true,
    showOnlineStatus: false
  });

  // Load user settings on component mount
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        phone: user.profile?.phone || ""
      });
    }
    loadUserSettings();
  }, [user]);

  const loadUserSettings = async () => {
    try {
      setLoading(true);
      const response = await httpClient.get(`${config.apiBaseUrl}/users/settings`);
      if (response.data) {
        const settings = response.data;
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
        if (settings.privacy) {
          setPrivacy(settings.privacy);
        }
      }
    } catch (error) {
      // Settings endpoint might not exist yet, use defaults
      console.log("Settings not available, using defaults");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      setProfileErrors({});

      // Validate profile data
      const validation = profileSchema.safeParse(profileData);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.issues.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setProfileErrors(errors);
        return;
      }

      const response = await httpClient.put(`${config.apiBaseUrl}/users/profile`, profileData);
      
      if (response.data) {
        // Refresh user session to get updated data
        await checkSession();
        toast({
          title: "Profile Updated",
          description: "Your profile has been successfully updated.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    try {
      setLoading(true);
      setPasswordErrors({});

      // Validate password data
      const validation = passwordSchema.safeParse(passwordData);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.issues.forEach((err: any) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setPasswordErrors(errors);
        return;
      }

      await httpClient.put(`${config.apiBaseUrl}/users/password`, {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });

      toast({
        title: "Password Updated",
        description: "Your password has been successfully changed.",
      });
    } catch (error: any) {
      toast({
        title: "Password Change Failed",
        description: error.response?.data?.message || "Failed to change password. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setLoading(true);
      await httpClient.put(`${config.apiBaseUrl}/users/settings/notifications`, notifications);
      toast({
        title: "Notifications Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrivacyUpdate = async () => {
    try {
      setLoading(true);
      await httpClient.put(`${config.apiBaseUrl}/users/settings/privacy`, privacy);
      toast({
        title: "Privacy Settings Updated",
        description: "Your privacy preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    const confirmation = prompt("Type 'DELETE' to confirm account deletion:");
    if (confirmation !== "DELETE") {
      toast({
        title: "Account Deletion Cancelled",
        description: "Account deletion was cancelled.",
      });
      return;
    }

    try {
      setLoading(true);
      await httpClient.delete(`${config.apiBaseUrl}/users/account`);
      
      // Log out user and redirect
      useAuthStore.getState().logout();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Deletion Failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "account", label: "Account", icon: Settings }
  ];

  if (loading && !user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Settings className="text-blue-600" />
              Settings
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 text-blue-700 border border-blue-200"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon size={18} />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    {(() => {
                      const currentTab = tabs.find(tab => tab.id === activeTab);
                      if (currentTab?.icon) {
                        const Icon = currentTab.icon;
                        return <Icon size={24} />;
                      }
                      return null;
                    })()}
                    {tabs.find(tab => tab.id === activeTab)?.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Profile Settings Tab */}
                  {activeTab === "profile" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Full Name"
                          Icon={User}
                          value={profileData.name}
                          onChange={(e: any) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          error={profileErrors.name}
                        />
                        <FormInput
                          label="Email Address"
                          Icon={Mail}
                          inputType="email"
                          value={profileData.email}
                          onChange={(e: any) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          error={profileErrors.email}
                        />
                      </div>
                      
                      <FormInput
                        label="Phone Number"
                        Icon={Phone}
                        placeholder="+61 4XX XXX XXX"
                        value={profileData.phone}
                        onChange={(e: any) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        error={profileErrors.phone}
                      />

                      <div className="flex justify-end">
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <LoadingSpinner />
                          ) : (
                            <Save size={16} />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Security Settings Tab */}
                  {activeTab === "security" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <FormInput
                          label="Current Password"
                          inputType={showPasswords.current ? "text" : "password"}
                          Icon={Key}
                          value={passwordData.currentPassword}
                          onChange={(e: any) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          error={passwordErrors.currentPassword}
                          endIcon={showPasswords.current ? EyeOff : Eye}
                          onEndIconClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        />
                        
                        <FormInput
                          label="New Password"
                          inputType={showPasswords.new ? "text" : "password"}
                          Icon={Key}
                          value={passwordData.newPassword}
                          onChange={(e: any) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          error={passwordErrors.newPassword}
                          endIcon={showPasswords.new ? EyeOff : Eye}
                          onEndIconClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        />
                        
                        <FormInput
                          label="Confirm New Password"
                          inputType={showPasswords.confirm ? "text" : "password"}
                          Icon={Key}
                          value={passwordData.confirmPassword}
                          onChange={(e: any) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          error={passwordErrors.confirmPassword}
                          endIcon={showPasswords.confirm ? EyeOff : Eye}
                          onEndIconClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handlePasswordChange}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <LoadingSpinner />
                          ) : (
                            <Shield size={16} />
                          )}
                          Update Password
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Notifications Tab */}
                  {activeTab === "notifications" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {Object.entries({
                          emailNotifications: "Email Notifications",
                          jobAlerts: "Job Alerts",
                          applicationUpdates: "Application Updates",
                          marketingEmails: "Marketing Emails"
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{label}</h4>
                              <p className="text-sm text-gray-600">
                                {key === 'emailNotifications' && "Receive general email notifications"}
                                {key === 'jobAlerts' && "Get notified about new job matches"}
                                {key === 'applicationUpdates' && "Updates on your job applications"}
                                {key === 'marketingEmails' && "Promotional emails and newsletters"}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={notifications[key as keyof typeof notifications]}
                                onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleNotificationUpdate}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <LoadingSpinner />
                          ) : (
                            <Bell size={16} />
                          )}
                          Save Preferences
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Privacy Tab */}
                  {activeTab === "privacy" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        {Object.entries({
                          profileVisible: "Public Profile",
                          allowRecruiters: "Allow Recruiters to Contact",
                          showOnlineStatus: "Show Online Status"
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h4 className="font-medium">{label}</h4>
                              <p className="text-sm text-gray-600">
                                {key === 'profileVisible' && "Make your profile visible to other users"}
                                {key === 'allowRecruiters' && "Allow recruiters to contact you directly"}
                                {key === 'showOnlineStatus' && "Show when you're online to other users"}
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={privacy[key as keyof typeof privacy]}
                                onChange={(e) => setPrivacy(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handlePrivacyUpdate}
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <LoadingSpinner />
                          ) : (
                            <Eye size={16} />
                          )}
                          Save Privacy Settings
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Account Management Tab */}
                  {activeTab === "account" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="p-4 border border-gray-200 rounded-lg">
                          <h4 className="font-medium mb-2">Account Information</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Account Created:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Last Login:</strong> {user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}</p>
                            <p><strong>Account Status:</strong> <span className="text-green-600">{user?.is_active ? 'Active' : 'Inactive'}</span></p>
                            <p><strong>Email Verified:</strong> <span className={user?.email_verified ? 'text-green-600' : 'text-red-600'}>{user?.email_verified ? 'Yes' : 'No'}</span></p>
                          </div>
                        </div>

                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <strong>Danger Zone:</strong> Account deletion is permanent and cannot be undone. All your data, including your profile, applications, and saved jobs will be permanently deleted.
                          </AlertDescription>
                        </Alert>
                      </div>

                      <div className="flex justify-end">
                        <Button
                          onClick={handleAccountDeletion}
                          disabled={loading}
                          variant="destructive"
                          className="flex items-center gap-2"
                        >
                          {loading ? (
                            <LoadingSpinner />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;