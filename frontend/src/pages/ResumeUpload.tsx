import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
} from "lucide-react";
import ResumePreview from "../components/molecules/ResumePreview";
import { ResumeRenameModal } from "../components/molecules/ResumeRenameModal";
import useResumeStore from "@/stores/useResumeStore";
import useAuthStore from "@/stores/useAuthStore";
import { useToast } from "@/components/ui/use-toast";

export default function CVAnalysisPage() {
  const [analysisState, setAnalysisState] = useState("idle");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [triggerAnalysis, setTriggerAnalysis] = useState(false);
  
  // Authentication state
  const { isAuthenticated } = useAuthStore();

  // Resume store
  const {
    currentResume,
    isUploading,
    uploadProgress,
    uploadError,
    uploadResume,
    deleteResume,
    updateResumeName,
    fetchCurrentResume,
    clearUploadState,
  } = useResumeStore();

  const { toast } = useToast();

  // Check if resume is uploaded (from store or local state)
  const resumeUploaded = Boolean(currentResume || uploadedFile);
  const resumeName = currentResume?.custom_name || currentResume?.filename || "Uploaded Resume";

  useEffect(() => {
    // Only fetch resume if user is authenticated
    if (isAuthenticated) {
      fetchCurrentResume();
    }
  }, [isAuthenticated, fetchCurrentResume]);

  // Clear upload error when component unmounts
  useEffect(() => {
    return () => clearUploadState();
  }, [clearUploadState]);

  const startAnalysis = () => {
    setAnalysisState("analyzing");
    setTriggerAnalysis(true);
    // Reset trigger after a short delay to allow ResumePreview to detect the change
    setTimeout(() => setTriggerAnalysis(false), 100);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadResume(file);
      
      setUploadedFile(file);
      setAnalysisState("idle");
      
      toast({
        title: "Upload successful",
        description: "Your resume has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResume = async () => {
    try {
      await deleteResume();
      setUploadedFile(null);
      setAnalysisState("idle");
      
      toast({
        title: "Resume deleted",
        description: "Your resume has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRenameResume = async (newName: string) => {
    try {
      await updateResumeName(newName);
      toast({
        title: "Resume renamed",
        description: `Resume renamed to "${newName}" successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Rename failed",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleAnalysisComplete = (analysis: any) => {
    console.log("Analysis completed:", analysis);
    setAnalysisState("complete");
    toast({
      title: "Analysis complete",
      description: `Resume analyzed successfully with a score of ${analysis.score}/100`,
    });
  };

  const handleAnalysisError = (error: string) => {
    console.error("Analysis failed:", error);
    setAnalysisState("idle");
    
    // Show specific error message for document validation failures
    if (error.includes("not recognized as a resume") || error.includes("Document validation failed")) {
      toast({
        title: "Document validation failed",
        description: "The uploaded document is not recognized as a resume. Please upload a valid resume/CV document.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Analysis failed",
        description: error || "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Resume Analysis</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <div className="space-y-6">
              {/* Upload Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Resume
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!resumeUploaded ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <Upload className="w-12 h-12 text-gray-400" />
                        <div>
                          <p className="text-lg font-medium">
                            {isUploading ? "Uploading..." : "Drop your resume here"}
                          </p>
                          <p className="text-sm text-gray-500">
                            or click to browse (PDF files only - max 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <div>
                            <p className="font-medium">Resume uploaded successfully</p>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-gray-600">{resumeName}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsRenameModalOpen(true)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit3 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDeleteResume}
                          className="flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Remove</span>
                        </Button>
                      </div>

                      {analysisState === "idle" && (
                        <Button
                          onClick={startAnalysis}
                          className="w-full"
                        >
                          Start Analysis
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Upload Progress</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  {/* Upload Error */}
                  {uploadError && (
                    <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <p className="text-sm text-red-600">{uploadError}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analysis Progress */}
              {analysisState === "analyzing" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      Analyzing Resume
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      We're analyzing your resume for content quality, ATS compatibility, and improvement suggestions.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Analysis Complete */}
              {analysisState === "complete" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Analysis Complete
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">
                      Your resume has been analyzed successfully. Review the results and suggestions on the right.
                    </p>
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => setAnalysisState("idle")}
                        variant="outline"
                      >
                        Run Again
                      </Button>
                      <Button>
                        Download Improved Resume
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Preview Section */}
            <div>
              <ResumePreview
                resumeId={currentResume?.id}
                resumeFile={uploadedFile || undefined}
                onAnalysisComplete={handleAnalysisComplete}
                onAnalysisError={handleAnalysisError}
                className="w-full"
                autoAnalyze={false}
                triggerAnalysis={triggerAnalysis}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Rename Modal */}
      <ResumeRenameModal
        isOpen={isRenameModalOpen}
        currentName={resumeName}
        onClose={() => setIsRenameModalOpen(false)}
        onSave={handleRenameResume}
      />
    </div>
  );
}
