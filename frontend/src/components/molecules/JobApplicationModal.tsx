import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Alert, AlertDescription } from "../ui/alert";
import { LoadingSpinner } from "./LoadingSpinner";
import EnhancedFormInput from "./EnhancedFormInput";
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
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import * as z from "zod";

// Job application form schema
const jobApplicationSchema = z.object({
  coverLetter: z.string()
    .min(50, "Cover letter must be at least 50 characters")
    .max(2000, "Cover letter cannot exceed 2000 characters")
    .refine(
      (val) => val.trim().length >= 50, 
      "Cover letter must contain at least 50 meaningful characters"
    ),
  resume: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Resume file size must be less than 5MB')
    .refine(
      file => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type),
      'Only PDF and Word documents are allowed'
    )
    .optional(),
  phone: z.string()
    .refine(
      (val) => !val || /^\+?61\d{9}$/.test(val.replace(/\s/g, '')), 
      "Please enter a valid Australian phone number (+61 format)"
    )
    .optional(),
  linkedinUrl: z.string()
    .refine(
      (val) => !val || val === "" || (z.string().url().safeParse(val).success && val.includes('linkedin.com')),
      "Please enter a valid LinkedIn profile URL"
    )
    .optional(),
  portfolioUrl: z.string()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      "Please enter a valid portfolio URL"
    )
    .optional(),
  availabilityDate: z.string()
    .refine(
      (val) => !val || new Date(val) >= new Date(),
      "Availability date cannot be in the past"
    )
    .optional(),
  salaryExpectation: z.string()
    .refine(
      (val) => !val || /^\$?[\d,]+(\.?\d{2})?(\s?-\s?\$?[\d,]+(\.?\d{2})?)?\s?(AUD|per year|annually)?$/i.test(val.trim()),
      "Please enter a valid salary expectation (e.g., $80,000 or $70,000 - $90,000)"
    )
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
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

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
  useEffect(() => {
    const checkExistingResume = async () => {
      try {
        const response = await fetch(buildApiUrl('/resume/current'), {
          credentials: 'include',
        });
        if (response.ok) {
          setHasExistingResume(true);
        }
      } catch (error) {
        // No existing resume found
      }
    };
    
    if (isOpen) {
      checkExistingResume();
    }
  }, [isOpen]);

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
      setSubmitStatus('submitting');
      setSubmitError(null);
      setError("root", { message: "" }); // Clear any previous errors

      // Validation for resume requirement (if no existing resume and no uploaded resume)
      if (!hasExistingResume && !selectedResume) {
        throw new Error('Please upload a resume or ensure you have one in your profile');
      }

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
      setSubmitStatus('success');

      // Add to local store for tracking
      addApplication({
        jobTitle: job.title,
        company: job.firm,
        status: 'applied',
        location: job.location,
        jobUrl: `/job-details/${job.id}`,
        appliedDate: Date.now(),
        lastUpdated: Date.now(),
      });

      // Show success message and wait before closing
      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} at ${job.firm} has been submitted successfully.`,
      });

      // Close modal after 2 seconds to allow user to see success state
      setTimeout(() => {
        onClose();
        navigate('/dashboard?tab=applications');
      }, 2000);

    } catch (error) {
      console.error('Application submission failed:', error);
      setSubmitStatus('error');
      const errorMessage = error instanceof Error ? error.message : "Failed to submit application. Please try again.";
      setSubmitError(errorMessage);
      setError("root", { message: errorMessage });
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
            {submitStatus === 'success' ? (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                >
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-lg font-semibold text-main-text mb-2">
                  Application Submitted Successfully!
                </h3>
                <p className="text-searchbar-text mb-4">
                  Your application for {job.title} at {job.firm} has been submitted. 
                  You'll be redirected to your dashboard shortly.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-searchbar-text">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errors.root && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.root.message}</AlertDescription>
                  </Alert>
                )}

                {submitStatus === 'error' && submitError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
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
                <EnhancedFormInput
                  inputType="tel"
                  label="Phone Number"
                  placeholder="+61 4XX XXX XXX"
                  error={errors.phone?.message}
                  isLoading={submitStatus === 'submitting'}
                  helpText="Include country code for Australian numbers"
                  validationRules={["Valid Australian phone number (+61 format)"]}
                  showValidation={!!errors.phone}
                  {...register("phone")}
                />
                
                <EnhancedFormInput
                  inputType="url"
                  label="LinkedIn Profile"
                  placeholder="https://linkedin.com/in/yourprofile"
                  error={errors.linkedinUrl?.message}
                  isLoading={submitStatus === 'submitting'}
                  helpText="Your professional LinkedIn profile URL"
                  validationRules={["Must be a valid LinkedIn profile URL"]}
                  showValidation={!!errors.linkedinUrl}
                  {...register("linkedinUrl")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EnhancedFormInput
                  inputType="url"
                  label="Portfolio URL"
                  placeholder="https://yourportfolio.com"
                  error={errors.portfolioUrl?.message}
                  isLoading={submitStatus === 'submitting'}
                  helpText="Link to your work samples or portfolio"
                  validationRules={["Must be a valid URL"]}
                  showValidation={!!errors.portfolioUrl}
                  {...register("portfolioUrl")}
                />
                
                <EnhancedFormInput
                  inputType="date"
                  label="Available Start Date"
                  error={errors.availabilityDate?.message}
                  isLoading={submitStatus === 'submitting'}
                  helpText="When can you start this position?"
                  validationRules={["Date cannot be in the past"]}
                  showValidation={!!errors.availabilityDate}
                  {...register("availabilityDate")}
                />
              </div>

              <EnhancedFormInput
                inputType="text"
                label="Salary Expectation"
                placeholder="e.g., $80,000 - $100,000 AUD"
                error={errors.salaryExpectation?.message}
                isLoading={submitStatus === 'submitting'}
                helpText="Include currency and time period (optional)"
                validationRules={["Format: $80,000 or $70,000 - $90,000 AUD"]}
                showValidation={!!errors.salaryExpectation}
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
                  disabled={isSubmitting || submitStatus === 'submitting'}
                >
                  {submitStatus === 'submitting' ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default JobApplicationModal; 