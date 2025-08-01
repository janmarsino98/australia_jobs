import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { buildApiUrl } from "../config";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import FormInput from "../components/molecules/FormInput";
import { useZodForm } from "../hooks/useZodForm";
import { useToast } from "../components/ui/use-toast";
import useAuthStore from "../stores/useAuthStore";
import { motion } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Briefcase,
  GraduationCap,
  Award,
  Camera,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Star,
  Building,
  DollarSign,
  Home,
  Target
} from "lucide-react";
import * as z from "zod";

// Profile update schemas
const basicInfoSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string()
    .regex(/^\+?61\d{9}$/, "Please enter a valid Australian phone number")
    .optional()
    .or(z.literal("")),
  bio: z.string().max(500, "Bio cannot exceed 500 characters").optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional()
  }).optional()
});

const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional()
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  location: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  gpa: z.string().optional()
});

const preferencesSchema = z.object({
  jobType: z.array(z.string()).optional(),
  industry: z.array(z.string()).optional(),
  workArrangement: z.array(z.string()).optional(),
  salaryRange: z.object({
    min: z.number().min(0).optional(),
    max: z.number().min(0).optional()
  }).optional(),
  locationRadius: z.number().min(0).max(100).optional(),
  companySize: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional()
});

interface UserProfile {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  location?: {
    city?: string;
    state?: string;
  };
  profileImage?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  certifications?: Certification[];
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  preferences?: {
    jobType?: string[];
    salaryRange?: {
      min?: number;
      max?: number;
    };
    workArrangement?: string[];
    industry?: string[];
  };
}

interface Experience {
  id: string;
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  gpa?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
}

const UserProfilePage = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'basic');
  const [newSkill, setNewSkill] = useState('');
  const [, setEditingExperience] = useState<string | null>(null);
  const [, setEditingEducation] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useZodForm({
    schema: basicInfoSchema,
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      bio: "",
      location: { city: "", state: "" }
    },
  });

  const experienceForm = useZodForm({
    schema: experienceSchema,
    defaultValues: {
      jobTitle: "",
      company: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: ""
    }
  });

  const educationForm = useZodForm({
    schema: educationSchema,
    defaultValues: {
      degree: "",
      institution: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      gpa: ""
    }
  });

  const preferencesForm = useZodForm({
    schema: preferencesSchema,
    defaultValues: {
      jobType: [],
      industry: [],
      workArrangement: [],
      salaryRange: { min: undefined, max: undefined },
      locationRadius: 25,
      companySize: [],
      benefits: []
    }
  });

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('/users/profile'), {
          credentials: 'include'
        });

        if (response.ok) {
          const profileData = await response.json();
          setProfile(profileData);
          
          // Populate form with existing data
          reset({
            name: profileData.name || "",
            email: profileData.email || "",
            phone: profileData.phone || "",
            bio: profileData.bio || "",
            location: {
              city: profileData.location?.city || "",
              state: profileData.location?.state || ""
            }
          });
        } else {
          // If no profile exists, use auth user data
          if (user) {
            const initialProfile = {
              name: user.name,
              email: user.email,
              phone: "",
              bio: "",
              location: user.location || {},
              skills: [],
              experience: [],
              education: [],
              certifications: [],
              socialLinks: {},
              preferences: {}
            };
            setProfile(initialProfile);
            reset({
              name: user.name,
              email: user.email,
              phone: "",
              bio: "",
              location: user.location || { city: "", state: "" }
            });
          }
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, reset, toast]);

  const onSubmitBasicInfo = async (data: any) => {
    try {
      const response = await fetch("http://localhost:5000/users/profile", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      
      toast({
        title: "Profile Updated",
        description: "Your basic information has been updated successfully.",
      });
    } catch (error) {
      console.error("Profile update failed:", error);
      setError("root", {
        message: "Failed to update profile. Please try again.",
      });
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && profile) {
      const updatedSkills = [...(profile.skills || []), newSkill.trim()];
      setProfile({ ...profile, skills: updatedSkills });
      setNewSkill('');
      
      // Update skills on backend
      updateSkills(updatedSkills);
    }
  };

  const removeSkill = (skillToRemove: string) => {
    if (profile) {
      const updatedSkills = profile.skills?.filter(skill => skill !== skillToRemove) || [];
      setProfile({ ...profile, skills: updatedSkills });
      updateSkills(updatedSkills);
    }
  };

  const updateSkills = async (skills: string[]) => {
    try {
      await fetch(buildApiUrl('/users/profile/skills'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ skills }),
      });
    } catch (error) {
      console.error("Failed to update skills:", error);
    }
  };

  const addExperience = async (data: any) => {
    try {
      const response = await fetch(buildApiUrl('/users/profile/experience'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newExperience = await response.json();
        setProfile(prev => prev ? {
          ...prev,
          experience: [...(prev.experience || []), newExperience]
        } : null);
        
        experienceForm.reset();
        toast({
          title: "Experience Added",
          description: "Work experience has been added to your profile.",
        });
      }
    } catch (error) {
      console.error("Failed to add experience:", error);
    }
  };

  const addEducation = async (data: any) => {
    try {
      const response = await fetch(buildApiUrl('/users/profile/education'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const newEducation = await response.json();
        setProfile(prev => prev ? {
          ...prev,
          education: [...(prev.education || []), newEducation]
        } : null);
        
        educationForm.reset();
        toast({
          title: "Education Added",
          description: "Education has been added to your profile.",
        });
      }
    } catch (error) {
      console.error("Failed to add education:", error);
    }
  };

  const removeExperience = async (experienceId: string) => {
    try {
      const response = await fetch(buildApiUrl(`/users/profile/experience/${experienceId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          experience: prev.experience?.filter(exp => exp.id !== experienceId) || []
        } : null);
        
        toast({
          title: "Experience Removed",
          description: "Work experience has been removed from your profile.",
        });
      }
    } catch (error) {
      console.error("Failed to remove experience:", error);
      toast({
        title: "Error",
        description: "Failed to remove experience. Please try again.",
        variant: "destructive"
      });
    }
  };

  const removeEducation = async (educationId: string) => {
    try {
      const response = await fetch(buildApiUrl(`/users/profile/education/${educationId}`), {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setProfile(prev => prev ? {
          ...prev,
          education: prev.education?.filter(edu => edu.id !== educationId) || []
        } : null);
        
        toast({
          title: "Education Removed",
          description: "Education has been removed from your profile.",
        });
      }
    } catch (error) {
      console.error("Failed to remove education:", error);
      toast({
        title: "Error",
        description: "Failed to remove education. Please try again.",
        variant: "destructive"
      });
    }
  };

  const updatePreferences = async (data: any) => {
    try {
      const response = await fetch(buildApiUrl('/users/profile/preferences'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedPreferences = await response.json();
        setProfile(prev => prev ? {
          ...prev,
          preferences: updatedPreferences
        } : null);
        
        toast({
          title: "Preferences Updated",
          description: "Your job preferences have been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive"
      });
    }
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Award },
    { id: 'preferences', label: 'Preferences', icon: Star },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-main-white-bg">
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main-white-bg">
      
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile?.name?.charAt(0) || user?.name?.charAt(0) || 'U'}
              </div>
              <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center hover:bg-gray-50">
                <Camera className="w-3 h-3 text-gray-600" />
              </button>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-main-text">
                {profile?.name || user?.name}
              </h1>
              <p className="text-searchbar-text">
                {profile?.bio || "Complete your profile to help employers find you"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-pill-bg text-pill-text'
                            : 'hover:bg-gray-50 text-searchbar-text'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{section.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit(onSubmitBasicInfo)} className="space-y-6">
                    {errors.root && (
                      <Alert variant="destructive">
                        <AlertDescription>{errors.root.message}</AlertDescription>
                      </Alert>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="Full Name"
                        Icon={User}
                        error={errors.name?.message}
                        {...register("name")}
                      />
                      
                      <FormInput
                        label="Email Address"
                        Icon={Mail}
                        inputType="email"
                        error={errors.email?.message}
                        {...register("email")}
                      />
                    </div>

                    <FormInput
                      label="Phone Number"
                      Icon={Phone}
                      inputType="tel"
                      placeholder="+61 4XX XXX XXX"
                      error={errors.phone?.message}
                      {...register("phone")}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormInput
                        label="City"
                        Icon={MapPin}
                        error={errors.location && typeof errors.location === 'object' && 'city' in errors.location ? (errors.location.city as any)?.message : undefined}
                        {...register("location.city")}
                      />
                      
                      <FormInput
                        label="State"
                        Icon={MapPin}
                        error={errors.location && typeof errors.location === 'object' && 'state' in errors.location ? (errors.location.state as any)?.message : undefined}
                        {...register("location.state")}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-main-text">
                        Professional Bio
                      </label>
                      <textarea
                        {...register("bio")}
                        className="w-full min-h-[100px] p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-pill-text focus:border-transparent"
                        placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                      />
                      <div className="flex justify-between text-xs text-searchbar-text">
                        <span>{String(errors.bio?.message) || ''}</span>
                        <span>{watch("bio")?.length || 0}/500</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Skills Section */}
            {activeSection === 'skills' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <Button onClick={addSkill} disabled={!newSkill.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {profile?.skills?.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-2 px-3 py-1"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-gray-500 hover:text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>

                  {(!profile?.skills || profile.skills.length === 0) && (
                    <p className="text-searchbar-text text-center py-8">
                      Add skills to help employers find you for relevant positions
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Other sections would go here... */}
            {activeSection === 'experience' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Experience Form */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-medium text-main-text">Add New Experience</h3>
                    <form onSubmit={experienceForm.handleSubmit(addExperience)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Job Title"
                          Icon={Briefcase}
                          error={experienceForm.formState.errors.jobTitle?.message}
                          {...experienceForm.register("jobTitle")}
                        />
                        
                        <FormInput
                          label="Company"
                          Icon={Building}
                          error={experienceForm.formState.errors.company?.message}
                          {...experienceForm.register("company")}
                        />
                      </div>

                      <FormInput
                        label="Location"
                        Icon={MapPin}
                        placeholder="Sydney, NSW"
                        error={experienceForm.formState.errors.location?.message}
                        {...experienceForm.register("location")}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Start Date"
                          Icon={Calendar}
                          inputType="month"
                          error={experienceForm.formState.errors.startDate?.message}
                          {...experienceForm.register("startDate")}
                        />
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="current-role"
                              {...experienceForm.register("current")}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor="current-role" className="text-sm font-medium text-main-text">
                              I currently work here
                            </label>
                          </div>
                          {!experienceForm.watch("current") && (
                            <FormInput
                              label="End Date"
                              Icon={Calendar}
                              inputType="month"
                              error={experienceForm.formState.errors.endDate?.message}
                              {...experienceForm.register("endDate")}
                            />
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-main-text">
                          Job Description
                        </label>
                        <textarea
                          {...experienceForm.register("description")}
                          className="w-full min-h-[100px] p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-pill-text focus:border-transparent"
                          placeholder="Describe your role, responsibilities, and key achievements..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={experienceForm.formState.isSubmitting}
                        >
                          {experienceForm.formState.isSubmitting ? (
                            <>
                              <LoadingSpinner className="h-4 w-4 mr-2" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Experience
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => experienceForm.reset()}
                        >
                          Clear Form
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Experience List */}
                  <div className="space-y-4">
                    {profile?.experience?.map((exp, index) => (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-main-text">
                              {exp.jobTitle}
                            </h4>
                            <p className="text-pill-text font-medium">{exp.company}</p>
                            {exp.location && (
                              <p className="text-searchbar-text text-sm flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {exp.location}
                              </p>
                            )}
                            <p className="text-searchbar-text text-sm flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(exp.startDate).toLocaleDateString('en-AU', { 
                                year: 'numeric', 
                                month: 'long' 
                              })} - {
                                exp.current 
                                  ? 'Present' 
                                  : exp.endDate 
                                    ? new Date(exp.endDate).toLocaleDateString('en-AU', { 
                                        year: 'numeric', 
                                        month: 'long' 
                                      })
                                    : 'Not specified'
                              }
                            </p>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingExperience(exp.id)}
                              className="text-gray-500 hover:text-pill-text"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeExperience(exp.id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        
                        {exp.description && (
                          <div className="text-sm text-searchbar-text pt-2 border-t border-gray-100">
                            <p className="whitespace-pre-wrap">{exp.description}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>

                  {(!profile?.experience || profile.experience.length === 0) && (
                    <div className="text-center py-8 text-searchbar-text">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No work experience added yet.</p>
                      <p className="text-sm">Add your professional experience to help employers understand your background.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'education' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <GraduationCap className="w-5 h-5 mr-2" />
                    Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Add New Education Form */}
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-medium text-main-text">Add New Education</h3>
                    <form onSubmit={educationForm.handleSubmit(addEducation)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Degree/Qualification"
                          Icon={GraduationCap}
                          placeholder="Bachelor of Computer Science"
                          error={educationForm.formState.errors.degree?.message}
                          {...educationForm.register("degree")}
                        />
                        
                        <FormInput
                          label="Institution"
                          Icon={Building}
                          placeholder="University of Sydney"
                          error={educationForm.formState.errors.institution?.message}
                          {...educationForm.register("institution")}
                        />
                      </div>

                      <FormInput
                        label="Location"
                        Icon={MapPin}
                        placeholder="Sydney, NSW"
                        error={educationForm.formState.errors.location?.message}
                        {...educationForm.register("location")}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput
                          label="Start Date"
                          Icon={Calendar}
                          inputType="month"
                          error={educationForm.formState.errors.startDate?.message}
                          {...educationForm.register("startDate")}
                        />
                        
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="current-study"
                              {...educationForm.register("current")}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor="current-study" className="text-sm font-medium text-main-text">
                              Currently studying
                            </label>
                          </div>
                          {!educationForm.watch("current") && (
                            <FormInput
                              label="End Date"
                              Icon={Calendar}
                              inputType="month"
                              error={educationForm.formState.errors.endDate?.message}
                              {...educationForm.register("endDate")}
                            />
                          )}
                        </div>

                        <FormInput
                          label="GPA (Optional)"
                          Icon={Star}
                          placeholder="3.8/4.0 or HD"
                          error={educationForm.formState.errors.gpa?.message}
                          {...educationForm.register("gpa")}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          disabled={educationForm.formState.isSubmitting}
                        >
                          {educationForm.formState.isSubmitting ? (
                            <>
                              <LoadingSpinner className="h-4 w-4 mr-2" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="h-4 w-4 mr-2" />
                              Add Education
                            </>
                          )}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => educationForm.reset()}
                        >
                          Clear Form
                        </Button>
                      </div>
                    </form>
                  </div>

                  {/* Existing Education List */}
                  <div className="space-y-4">
                    {profile?.education?.map((edu, index) => (
                      <motion.div
                        key={edu.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="border border-gray-200 rounded-lg p-6 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-main-text">
                              {edu.degree}
                            </h4>
                            <p className="text-pill-text font-medium">{edu.institution}</p>
                            {edu.location && (
                              <p className="text-searchbar-text text-sm flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {edu.location}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-searchbar-text">
                              <p className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(edu.startDate).toLocaleDateString('en-AU', { 
                                  year: 'numeric', 
                                  month: 'long' 
                                })} - {
                                  edu.current 
                                    ? 'Present' 
                                    : edu.endDate 
                                      ? new Date(edu.endDate).toLocaleDateString('en-AU', { 
                                          year: 'numeric', 
                                          month: 'long' 
                                        })
                                      : 'Not specified'
                                }
                              </p>
                              {edu.gpa && (
                                <p className="flex items-center">
                                  <Star className="w-3 h-3 mr-1" />
                                  GPA: {edu.gpa}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => setEditingEducation(edu.id)}
                              className="text-gray-500 hover:text-pill-text"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeEducation(edu.id)}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {(!profile?.education || profile.education.length === 0) && (
                    <div className="text-center py-8 text-searchbar-text">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No education added yet.</p>
                      <p className="text-sm">Add your educational background to showcase your qualifications.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeSection === 'preferences' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Job Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={preferencesForm.handleSubmit(updatePreferences)} className="space-y-8">
                    {/* Job Types */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Briefcase className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Preferred Job Types</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {['Full-time', 'Part-time', 'Contract', 'Casual', 'Freelance', 'Internship'].map((type) => (
                          <label key={type} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={type}
                              {...preferencesForm.register("jobType")}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-main-text">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Industries */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Preferred Industries</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Technology', 'Healthcare', 'Finance', 'Education', 'Marketing', 'Sales',
                          'Engineering', 'Design', 'Construction', 'Hospitality', 'Retail', 'Manufacturing'
                        ].map((industry) => (
                          <label key={industry} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={industry}
                              {...preferencesForm.register("industry")}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-main-text">{industry}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Work Arrangement */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Home className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Work Arrangement</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {['Remote', 'Hybrid', 'On-site'].map((arrangement) => (
                          <label key={arrangement} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={arrangement}
                              {...preferencesForm.register("workArrangement")}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-main-text">{arrangement}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Salary Range */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Salary Expectations (AUD per year)</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormInput
                          label="Minimum Salary"
                          Icon={DollarSign}
                          inputType="number"
                          placeholder="50000"
                          error={preferencesForm.formState.errors.salaryRange && typeof preferencesForm.formState.errors.salaryRange === 'object' && 'min' in preferencesForm.formState.errors.salaryRange ? (preferencesForm.formState.errors.salaryRange.min as any)?.message : undefined}
                          {...preferencesForm.register("salaryRange.min", { valueAsNumber: true })}
                        />
                        <FormInput
                          label="Maximum Salary"
                          Icon={DollarSign}
                          inputType="number"
                          placeholder="120000"
                          error={preferencesForm.formState.errors.salaryRange && typeof preferencesForm.formState.errors.salaryRange === 'object' && 'max' in preferencesForm.formState.errors.salaryRange ? (preferencesForm.formState.errors.salaryRange.max as any)?.message : undefined}
                          {...preferencesForm.register("salaryRange.max", { valueAsNumber: true })}
                        />
                      </div>
                    </div>

                    {/* Location Preferences */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Location Radius</h3>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-main-text">
                          How far are you willing to travel? ({preferencesForm.watch("locationRadius")} km)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          {...preferencesForm.register("locationRadius", { valueAsNumber: true })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-xs text-searchbar-text">
                          <span>Local only</span>
                          <span>100+ km</span>
                        </div>
                      </div>
                    </div>

                    {/* Company Size */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Company Size Preference</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {['Startup (1-10)', 'Small (11-50)', 'Medium (51-200)', 'Large (200+)'].map((size) => (
                          <label key={size} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={size}
                              {...preferencesForm.register("companySize")}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-main-text">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Benefits */}
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-pill-text" />
                        <h3 className="text-lg font-medium text-main-text">Important Benefits</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          'Health Insurance', 'Flexible Hours', 'Professional Development', 
                          'Retirement Plan', 'Paid Time Off', 'Work from Home',
                          'Gym Membership', 'Stock Options', 'Maternity/Paternity Leave'
                        ].map((benefit) => (
                          <label key={benefit} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={benefit}
                              {...preferencesForm.register("benefits")}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm text-main-text">{benefit}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                      <Button
                        type="submit"
                        disabled={preferencesForm.formState.isSubmitting}
                        className="flex-1 md:flex-none"
                      >
                        {preferencesForm.formState.isSubmitting ? (
                          <>
                            <LoadingSpinner className="h-4 w-4 mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Preferences
                          </>
                        )}
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => preferencesForm.reset()}
                      >
                        Reset
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage; 