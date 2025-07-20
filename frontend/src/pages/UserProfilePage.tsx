import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Globe,
  Linkedin,
  Github,
  Camera,
  Edit2,
  Save,
  X,
  Plus,
  Trash2,
  Star
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(searchParams.get('section') || 'basic');
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [editingEducation, setEditingEducation] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
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

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:5000/users/profile", {
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
      await fetch("http://localhost:5000/users/profile/skills", {
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
      const response = await fetch("http://localhost:5000/users/profile/experience", {
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
      const response = await fetch("http://localhost:5000/users/profile/education", {
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
                        error={errors.location?.city?.message}
                        {...register("location.city")}
                      />
                      
                      <FormInput
                        label="State"
                        Icon={MapPin}
                        error={errors.location?.state?.message}
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
                        <span>{errors.bio?.message}</span>
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
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Add a skill (e.g., JavaScript, Project Management)"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
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
                <CardContent>
                  <p className="text-searchbar-text mb-4">
                    Experience section coming soon...
                  </p>
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
                <CardContent>
                  <p className="text-searchbar-text mb-4">
                    Education section coming soon...
                  </p>
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
                  <p className="text-searchbar-text mb-4">
                    Job preferences section coming soon...
                  </p>
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