import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { LoadingSpinner } from "./LoadingSpinner";
import FormInput from "./FormInput";
import { useZodForm } from "../../hooks/useZodForm";
import { useToast } from "../ui/use-toast";
import useJobApplicationStore from "../../stores/useJobApplicationStore";
import { motion } from "framer-motion";
import { 
  X, 
  Upload, 
  FileText, 
  Trash2,
  Send,
  AlertCircle 
} from "lucide-react";
import * as z from "zod";

// Job application form schema
const jobApplicationSchema = z.object({
  coverLetter: z.string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000, "Cover letter cannot exceed 2000 characters"),
  resume: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Resume file size must be less than 5MB')
    .refine(
      file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Only PDF and Word documents are allowed'
    )
    .optional(),
  phone: z.string()
    .regex(/^\+?61\d{9}$/, "Please enter a valid Australian phone number")
    .optional(),
  linkedinUrl: z.string()
    .url("Please enter a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
  portfolioUrl: z.string()
    .url("Please enter a valid portfolio URL")
    .optional()
    .or(z.literal("")),
  availabilityDate: z.string()
    .optional(),
  salaryExpectation: z.string()
    .optional()
});

interface JobApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: {
    id: string;
    title: string;
    firm: string;
    location: string;
    jobtype?: string;
  };
}

const JobApplicationModal = ({ isOpen, onClose, job }: JobApplicationModalProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addApplication } = useJobApplicationStore();
  const [selectedResume, setSelectedResume] = useState<File | null>(null);
  const [hasExistingResume, setHasExistingResume] = useState(false);
  const [useExistingResume, setUseExistingResume] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError,
  } = useZodForm({
    schema: jobApplicationSchema,
    defaultValues: {
      coverLetter: "",
      phone: "",
      linkedinUrl: "",
      portfolioUrl: "",
      availabilityDate: "",
      salaryExpectation: "",
    },
  });

  const coverLetter = watch("coverLetter");

  // Check for existing resume on component mount
  useState(() => {
    const checkExistingResume = async () => {
      try {
        const response = await fetch(buildApiUrl('/resume/current'), {
          credentials: 'include',
        });
        if (response.ok) {
          setHasExistingResume(true);
        }
      } catch (error) {
        console.log("No existing resume found");
      }
    };
    
    if (isOpen) {
      checkExistingResume();
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedResume(file);
      setValue("resume", file);
      setUseExistingResume(false);
    }
  };

  const removeSelectedFile = () => {
    setSelectedResume(null);
    setValue("resume", undefined);
    setUseExistingResume(hasExistingResume);
  };

  const onSubmit = async (data: any) => {
    try {
      // Prepare form data for submission
      const formData = new FormData();
      formData.append('jobId', job.id);
      formData.append('coverLetter', data.coverLetter);
      
      if (data.phone) formData.append('phone', data.phone);
      if (data.linkedinUrl) formData.append('linkedinUrl', data.linkedinUrl);
      if (data.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
      if (data.availabilityDate) formData.append('availabilityDate', data.availabilityDate);
      if (data.salaryExpectation) formData.append('salaryExpectation', data.salaryExpectation);
      
      // Handle resume
      if (selectedResume) {
        formData.append('resume', selectedResume);
        formData.append('useExistingResume', 'false');
      } else {
        formData.append('useExistingResume', 'true');
      }

      // Submit application
      const response = await fetch(buildApiUrl('/jobs/apply'), {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const applicationData = await response.json();

      // Add to local store for tracking
      addApplication({
        jobTitle: job.title,
        company: job.firm,
        status: 'applied',
        location: job.location,
      });

      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} at ${job.firm} has been submitted successfully.`,
      });

      onClose();
      
      // Navigate to applications tracker
      navigate('/dashboard');

    } catch (error) {
      console.error('Application submission failed:', error);
      setError("root", {
        message: error instanceof Error ? error.message : "Failed to submit application. Please try again.",
      });
    }
  };

  if (!isOpen) return null;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={modalVariants}
      >
        <Card className="bg-white shadow-xl">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-main-text">
                  Apply for {job.title}
                </CardTitle>
                <p className="text-searchbar-text text-sm mt-1">
                  {job.firm} • {job.location}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {errors.root && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{errors.root.message}</AlertDescription>
                </Alert>
              )}

              {/* Cover Letter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-main-text">
                  Cover Letter *
                </label>
                <textarea
                  {...register("coverLetter")}
                  className="w-full min-h-[120px] p-3 border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-pill-text focus:border-transparent"
                  placeholder="Tell us why you're perfect for this role..."
                />
                <div className="flex justify-between text-xs text-searchbar-text">
                  <span>{errors.coverLetter?.message}</span>
                  <span>{coverLetter?.length || 0}/2000</span>
                </div>
              </div>

              {/* Resume Upload */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-main-text">
                  Resume
                </label>
                
                {hasExistingResume && !selectedResume && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-800">
                        We'll use your existing resume from your profile
                      </span>
                    </div>
                  </div>
                )}

                {selectedResume && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-blue-800">
                          {selectedResume.name}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeSelectedFile}
                        className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-searchbar-text mb-2">
                    {hasExistingResume ? "Upload a different resume (optional)" : "Upload your resume"}
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>Choose File</span>
                    </Button>
                  </label>
                  <p className="text-xs text-searchbar-text mt-1">
                    PDF, DOC, or DOCX (max 5MB)
                  </p>
                </div>
                {errors.resume && (
                  <p className="text-xs text-red-600">{errors.resume.message}</p>
                )}
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  inputType="tel"
                  label="Phone Number"
                  placeholder="+61 4XX XXX XXX"
                  error={errors.phone?.message}
                  {...register("phone")}
                />
                
                <FormInput
                  inputType="url"
                  label="LinkedIn Profile"
                  placeholder="https://linkedin.com/in/yourprofile"
                  error={errors.linkedinUrl?.message}
                  {...register("linkedinUrl")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  inputType="url"
                  label="Portfolio URL"
                  placeholder="https://yourportfolio.com"
                  error={errors.portfolioUrl?.message}
                  {...register("portfolioUrl")}
                />
                
                <FormInput
                  inputType="date"
                  label="Available Start Date"
                  error={errors.availabilityDate?.message}
                  {...register("availabilityDate")}
                />
              </div>

              <FormInput
                inputType="text"
                label="Salary Expectation"
                placeholder="e.g., $80,000 - $100,000 AUD"
                error={errors.salaryExpectation?.message}
                {...register("salaryExpectation")}
              />

              {/* Submit Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner className="h-4 w-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default JobApplicationModal; 