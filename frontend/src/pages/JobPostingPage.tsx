import { useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import FormInput from "../components/molecules/FormInput";
import { useToast } from "../components/ui/use-toast";
import { motion } from "framer-motion";
import { 
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Calendar,
  FileText,
  Building,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Save,
  Eye
} from "lucide-react";
import * as z from "zod";
import httpClient from "../httpClient";
import config from "../config";
import useAuthStore from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";

// Job posting validation schema
const jobPostingSchema = z.object({
  title: z.string().min(5, "Job title must be at least 5 characters"),
  company: z.string().min(2, "Company name is required"),
  location: z.object({
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    remote: z.boolean().optional()
  }),
  jobType: z.enum(["full-time", "part-time", "contract", "freelance", "internship"]),
  workArrangement: z.enum(["on-site", "remote", "hybrid"]),
  salary: z.object({
    min: z.number().min(0, "Minimum salary must be positive"),
    max: z.number().min(0, "Maximum salary must be positive"),
    currency: z.string().default("AUD"),
    period: z.enum(["hour", "day", "week", "month", "year"])
  }),
  description: z.string().min(100, "Job description must be at least 100 characters"),
  requirements: z.string().min(50, "Requirements must be at least 50 characters"),
  benefits: z.string().optional(),
  applicationDeadline: z.string().optional(),
  contactEmail: z.string().email("Valid email is required"),
  experienceLevel: z.enum(["entry", "mid", "senior", "executive"]),
  department: z.string().min(2, "Department is required"),
  tags: z.array(z.string()).max(10, "Maximum 10 tags allowed")
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

const JobPostingPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<JobPostingFormData>>({
    title: "",
    company: user?.profile?.display_name || "",
    location: { city: "", state: "", remote: false },
    jobType: "full-time",
    workArrangement: "on-site",
    salary: { min: 0, max: 0, currency: "AUD", period: "year" },
    description: "",
    requirements: "",
    benefits: "",
    applicationDeadline: "",
    contactEmail: user?.email || "",
    experienceLevel: "mid",
    department: "",
    tags: []
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  
  const totalSteps = 4;

  // Australian states
  const australianStates = [
    "NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"
  ];

  // Job type options
  const jobTypes = [
    { value: "full-time", label: "Full Time", icon: Clock },
    { value: "part-time", label: "Part Time", icon: Clock },
    { value: "contract", label: "Contract", icon: FileText },
    { value: "freelance", label: "Freelance", icon: Users },
    { value: "internship", label: "Internship", icon: Users }
  ];

  const workArrangements = [
    { value: "on-site", label: "On-site", description: "Work from office location" },
    { value: "remote", label: "Remote", description: "Work from anywhere" },
    { value: "hybrid", label: "Hybrid", description: "Mix of office and remote" }
  ];

  const experienceLevels = [
    { value: "entry", label: "Entry Level", description: "0-2 years experience" },
    { value: "mid", label: "Mid Level", description: "3-5 years experience" },
    { value: "senior", label: "Senior Level", description: "6+ years experience" },
    { value: "executive", label: "Executive", description: "Leadership role" }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...((prev as any)[parent] || {}),
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const stepErrors: Record<string, string> = {};
    
    switch (step) {
      case 1:
        if (!formData.title || formData.title.length < 5) {
          stepErrors.title = "Job title must be at least 5 characters";
        }
        if (!formData.company || formData.company.length < 2) {
          stepErrors.company = "Company name is required";
        }
        if (!formData.location?.city) {
          stepErrors['location.city'] = "City is required";
        }
        if (!formData.location?.state) {
          stepErrors['location.state'] = "State is required";
        }
        if (!formData.department || formData.department.length < 2) {
          stepErrors.department = "Department is required";
        }
        break;
      
      case 2:
        if (!formData.salary?.min || formData.salary.min <= 0) {
          stepErrors['salary.min'] = "Minimum salary is required";
        }
        if (!formData.salary?.max || formData.salary.max <= 0) {
          stepErrors['salary.max'] = "Maximum salary is required";
        }
        if (formData.salary?.max && formData.salary?.min && formData.salary.max < formData.salary.min) {
          stepErrors['salary.max'] = "Maximum salary must be greater than minimum";
        }
        break;
      
      case 3:
        if (!formData.description || formData.description.length < 100) {
          stepErrors.description = "Job description must be at least 100 characters";
        }
        if (!formData.requirements || formData.requirements.length < 50) {
          stepErrors.requirements = "Requirements must be at least 50 characters";
        }
        break;
      
      case 4:
        if (!formData.contactEmail || !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
          stepErrors.contactEmail = "Valid email is required";
        }
        break;
    }
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags && formData.tags.length < 10 && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    try {
      setLoading(true);
      
      // Validate entire form
      const validation = jobPostingSchema.safeParse(formData);
      if (!validation.success) {
        const formErrors: Record<string, string> = {};
        validation.error.issues.forEach((issue: any) => {
          const path = issue.path.join('.');
          formErrors[path] = issue.message;
        });
        setErrors(formErrors);
        toast({
          title: "Validation Error",
          description: "Please check all required fields and correct any errors.",
          variant: "destructive"
        });
        return;
      }

      const response = await httpClient.post(`${config.apiBaseUrl}/jobs`, validation.data);
      
      if (response.data) {
        toast({
          title: "Job Posted Successfully!",
          description: "Your job posting has been published and is now visible to job seekers.",
        });
        
        navigate('/employer/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Job Posting Failed",
        description: error.response?.data?.message || "Failed to post job. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveDraft = async () => {
    try {
      setLoading(true);
      await httpClient.post(`${config.apiBaseUrl}/jobs/draft`, formData);
      toast({
        title: "Draft Saved",
        description: "Your job posting draft has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Basic Job Information</h2>
              <p className="text-gray-600">Let's start with the essential details about your job opening</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <FormInput
                  label="Job Title"
                  Icon={Briefcase}
                  value={formData.title || ""}
                  onChange={(e: any) => handleInputChange('title', e.target.value)}
                  error={errors.title}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <FormInput
                label="Company Name"
                Icon={Building}
                value={formData.company || ""}
                onChange={(e: any) => handleInputChange('company', e.target.value)}
                error={errors.company}
                placeholder="Your company name"
              />

              <FormInput
                label="Department"
                Icon={Users}
                value={formData.department || ""}
                onChange={(e: any) => handleInputChange('department', e.target.value)}
                error={errors.department}
                placeholder="e.g. Engineering, Marketing"
              />

              <FormInput
                label="City"
                Icon={MapPin}
                value={formData.location?.city || ""}
                onChange={(e: any) => handleInputChange('location.city', e.target.value)}
                error={errors['location.city']}
                placeholder="e.g. Sydney"
              />

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">State</label>
                <select
                  value={formData.location?.state || ""}
                  onChange={(e) => handleInputChange('location.state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select State</option>
                  {australianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors['location.state'] && (
                  <p className="text-sm text-red-500 mt-1">{errors['location.state']}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Job Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {jobTypes.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('jobType', value)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      formData.jobType === value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={20} className="mx-auto mb-1" />
                    <div className="text-sm font-medium">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Work Arrangement</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {workArrangements.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('workArrangement', value)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      formData.workArrangement === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-gray-600 mt-1">{description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Compensation & Experience</h2>
              <p className="text-gray-600">Define salary range and experience requirements</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Salary Range (AUD)</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormInput
                  label="Minimum Salary"
                  Icon={DollarSign}
                  inputType="number"
                  value={formData.salary?.min?.toString() || ""}
                  onChange={(e: any) => handleInputChange('salary.min', parseInt(e.target.value) || 0)}
                  error={errors['salary.min']}
                  placeholder="50000"
                />
                <FormInput
                  label="Maximum Salary"
                  Icon={DollarSign}
                  inputType="number"
                  value={formData.salary?.max?.toString() || ""}
                  onChange={(e: any) => handleInputChange('salary.max', parseInt(e.target.value) || 0)}
                  error={errors['salary.max']}
                  placeholder="80000"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                  <select
                    value={formData.salary?.period || "year"}
                    onChange={(e) => handleInputChange('salary.period', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day</option>
                    <option value="week">Per Week</option>
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-3 block">Experience Level</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {experienceLevels.map(({ value, label, description }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleInputChange('experienceLevel', value)}
                    className={`p-4 border-2 rounded-lg transition-all text-left ${
                      formData.experienceLevel === value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-gray-600 mt-1">{description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <FormInput
                label="Application Deadline (Optional)"
                Icon={Calendar}
                inputType="date"
                value={formData.applicationDeadline || ""}
                onChange={(e: any) => handleInputChange('applicationDeadline', e.target.value)}
                error={errors.applicationDeadline}
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Job Description & Requirements</h2>
              <p className="text-gray-600">Provide detailed information about the role</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Job Description *
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the role, responsibilities, and what makes this position exciting..."
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{errors.description || "Minimum 100 characters"}</span>
                <span>{formData.description?.length || 0}/1000</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Requirements & Qualifications *
              </label>
              <textarea
                value={formData.requirements || ""}
                onChange={(e) => handleInputChange('requirements', e.target.value)}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="List required skills, experience, education, and qualifications..."
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>{errors.requirements || "Minimum 50 characters"}</span>
                <span>{formData.requirements?.length || 0}/500</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Benefits & Perks (Optional)
              </label>
              <textarea
                value={formData.benefits || ""}
                onChange={(e) => handleInputChange('benefits', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Health insurance, flexible hours, professional development, etc..."
              />
              <div className="text-sm text-gray-500 mt-1">
                {formData.benefits?.length || 0}/400
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Skills & Tags
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a skill or technology (e.g., React, Python)"
                />
                <Button type="button" onClick={addTag} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags?.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer hover:bg-red-100"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.tags?.length || 0}/10 tags
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Contact & Review</h2>
              <p className="text-gray-600">Finalize your job posting and review all details</p>
            </div>

            <div>
              <FormInput
                label="Contact Email"
                Icon={Users}
                inputType="email"
                value={formData.contactEmail || ""}
                onChange={(e: any) => handleInputChange('contactEmail', e.target.value)}
                error={errors.contactEmail}
                placeholder="recruiter@company.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                This email will receive job applications
              </p>
            </div>

            {/* Job Preview */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye size={20} />
                  Job Posting Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{formData.title}</h3>
                  <p className="text-gray-600">{formData.company} • {formData.location?.city}, {formData.location?.state}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="">{formData.jobType}</Badge>
                  <Badge variant="outline" className="">{formData.workArrangement}</Badge>
                  <Badge variant="outline" className="">{formData.experienceLevel}</Badge>
                  {formData.salary?.min && formData.salary?.max && (
                    <Badge variant="outline" className="">
                      ${formData.salary.min.toLocaleString()} - ${formData.salary.max.toLocaleString()} {formData.salary.period}
                    </Badge>
                  )}
                </div>

                {formData.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Description</h4>
                    <p className="text-gray-700 text-sm line-clamp-3">{formData.description}</p>
                  </div>
                )}

                {formData.tags && formData.tags.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.slice(0, 5).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {formData.tags.length > 5 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formData.tags.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please review all information carefully. Once published, your job posting will be visible to thousands of job seekers.
              </AlertDescription>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You need to be logged in as an employer to post jobs.</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back
              </Button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Post a New Job</h1>
            <p className="text-gray-600 mt-2">
              Create a compelling job posting to attract top talent
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-500">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-gray-500">
                {Math.round((currentStep / totalSteps) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <Save size={16} />
                Save Draft
              </Button>
              
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  {loading ? <LoadingSpinner /> : <CheckCircle size={16} />}
                  {loading ? 'Publishing...' : 'Publish Job'}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobPostingPage;