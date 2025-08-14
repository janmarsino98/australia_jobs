import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { 
  FileText, 
  User, 
  Award, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import { PDFPreview } from "./PDFPreview";
import httpClient from "@/httpClient";
import { ResumeData, ResumeAnalysis, ResumeMetadata } from "@/types";
import useAuthStore from "@/stores/useAuthStore";
import config from "@/config";

interface ResumePreviewProps {
  resumeId?: string;
  resumeFile?: File;
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void;
  onAnalysisError?: (error: string) => void;
  className?: string;
  autoAnalyze?: boolean; // Whether to automatically run analysis
  triggerAnalysis?: boolean; // When this changes to true, trigger analysis
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resumeId,
  resumeFile, 
  onAnalysisComplete,
  onAnalysisError,
  className = "",
  autoAnalyze = false,
  triggerAnalysis = false
}) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [resumeMetadata, setResumeMetadata] = useState<ResumeMetadata | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // Authentication state
  const { isAuthenticated } = useAuthStore();

  const fetchResumeMetadata = useCallback(async () => {
    if (!resumeId || !isAuthenticated) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get(`/resume/metadata`);
      setResumeMetadata(response.data);
    } catch (error: any) {
      console.error("Failed to fetch resume metadata:", error);
      setError("Failed to load resume metadata");
    } finally {
      setLoading(false);
    }
  }, [resumeId, isAuthenticated]);

  // Fetch resume metadata when resumeId changes and user is authenticated
  useEffect(() => {
    if (resumeId && isAuthenticated) {
      fetchResumeMetadata();
      setPreviewUrl(`${config.apiBaseUrl}/resume/current`);
    }
  }, [resumeId, isAuthenticated, fetchResumeMetadata]);

  // Parse resume content
  const parseResume = useCallback(async (file?: File): Promise<ResumeData> => {
    if (!file && !resumeId) {
      throw new Error("No file or resume ID provided");
    }
    
    if (!isAuthenticated) {
      throw new Error("User not authenticated");
    }

    try {
      if (resumeId) {
        // Use backend API to analyze resume content
        const response = await httpClient.post(`/resume/analyze`);
        // Extract parsed data from the backend response
        const parsedData = response.data.parsed_data || {};
        
        // Transform to expected format
        const transformedData = {
          personalInfo: {
            name: parsedData.contact_info?.names?.[0] || '',
            email: parsedData.contact_info?.emails?.[0] || '',
            phone: parsedData.contact_info?.phones?.[0] || '',
            location: parsedData.contact_info?.locations?.[0] || ''
          },
          summary: parsedData.summary,
          experience: parsedData.work_experience || [],
          education: parsedData.education || [],
          skills: parsedData.skills || [],
          certifications: parsedData.certifications || []
        };
        
        return transformedData;
      } else if (file) {
        // Upload and parse file
        const formData = new FormData();
        formData.append("file", file);
        
        const response = await httpClient.post("/resume/parse", formData);
        return response.data;
      }
    } catch (error: any) {
      console.error("Error parsing resume:", error);
      
      // Instead of returning mock data, throw a descriptive error
      const errorMessage = error.response?.data?.message || error.message || "Resume parsing failed";
      throw new Error(`Resume parsing unavailable: ${errorMessage}`);
    }
    
    throw new Error("Invalid parameters");
  }, [resumeId, isAuthenticated]);

  // Analyze resume content with Gemini structured analysis
  const analyzeResume = useCallback(async (): Promise<ResumeAnalysis> => {
    if (!resumeId && !resumeFile) {
      throw new Error("No resume to analyze");
    }
    
    if (!isAuthenticated) {
      throw new Error("User not authenticated");
    }

    try {
      let response;
      if (resumeId) {
        // Use structured analysis endpoint with document validation
        response = await httpClient.post(`/resume/analyze-structured`);
      } else if (resumeFile) {
        const formData = new FormData();
        formData.append("file", resumeFile);
        
        response = await httpClient.post("/resume/analyze-structured", formData);
      }
      
      if (!response?.data) {
        throw new Error("Analysis service returned no data");
      }

      const analysisData = response.data;
      
      // Check if document was validated as a resume
      if (!analysisData.success || !analysisData.is_resume) {
        throw new Error(
          analysisData.message || 
          "The uploaded document is not recognized as a resume. Please upload a valid resume/CV document."
        );
      }

      // Map backend response to frontend format
      const completenessAnalysis = analysisData.completeness_analysis || {};
      const structuredSummary = analysisData.structured_summary || {};
      
      // Transform to expected format
      const transformedAnalysis = {
        score: completenessAnalysis.completeness_score || 0,
        atsScore: analysisData.confidence_score * 100 || 0, // Use confidence as ATS score
        strengths: completenessAnalysis.feedback?.filter((item: string) => !item.toLowerCase().includes("add")) || [],
        improvements: completenessAnalysis.feedback?.filter((item: string) => item.toLowerCase().includes("add")) || [],
        keywords: analysisData.structured_data?.skills || [],
        sections: {
          contact_info: structuredSummary.has_professional_summary,
          experience: structuredSummary.work_experience_count > 0,
          education: structuredSummary.education_count > 0,
          skills: structuredSummary.skills_count > 0
        },
        analysis_id: analysisData.structured_doc_id,
        file_id: analysisData.file_id,
        analyzed_at: analysisData.analyzed_at,
        // Additional structured data
        structured_data: analysisData.structured_data,
        validation_result: analysisData.validation_result
      };

      return transformedAnalysis;
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
      
      // Handle specific validation errors
      if (error.response?.status === 400 && error.response?.data?.error?.includes("not recognized as a valid resume")) {
        throw new Error("Document validation failed: This document is not recognized as a resume. Please upload a valid resume/CV document.");
      }
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || "Resume analysis failed";
      throw new Error(`Resume analysis failed: ${errorMessage}`);
    }
  }, [resumeId, resumeFile, isAuthenticated]);

  // Function to manually trigger analysis
  const runAnalysis = useCallback(async () => {
    if (!isAuthenticated) {
      setError("User not authenticated");
      return;
    }
    
    if (!resumeFile && !resumeId) {
      setError("No resume to analyze");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const parsedData = await parseResume(resumeFile);
      setResumeData(parsedData);
      
      const analysisResult = await analyzeResume();
      setAnalysis(analysisResult);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      
      onAnalysisComplete?.(analysisResult);
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      const errorMessage = error.message || 'Failed to analyze resume';
      setError(errorMessage);
      onAnalysisError?.(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [isAuthenticated, resumeFile, resumeId, parseResume, analyzeResume, onAnalysisComplete, onAnalysisError]);

  // Auto-run analysis on component mount if autoAnalyze is true
  useEffect(() => {
    if (autoAnalyze && (resumeFile || resumeId) && isAuthenticated) {
      runAnalysis();
    }
  }, [resumeFile, resumeId, isAuthenticated, autoAnalyze, runAnalysis]);

  // Trigger analysis when triggerAnalysis prop changes to true
  useEffect(() => {
    if (triggerAnalysis && (resumeFile || resumeId) && isAuthenticated) {
      runAnalysis();
    }
  }, [triggerAnalysis, resumeFile, resumeId, isAuthenticated, runAnalysis]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isPDFFile = () => {
    if (resumeFile) {
      return resumeFile.type === 'application/pdf';
    }
    if (resumeMetadata) {
      return resumeMetadata.content_type === 'application/pdf' || resumeMetadata.filename.toLowerCase().endsWith('.pdf');
    }
    return false;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Loading Resume...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Error Loading Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Analyzing Resume...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing your resume</span>
              <span>{analysisProgress}%</span>
            </div>
            <Progress value={analysisProgress} className="h-2" />
          </div>
          <div className="text-sm text-gray-600">
            {analysisProgress < 30 && "Extracting text content..."}
            {analysisProgress >= 30 && analysisProgress < 60 && "Parsing sections..."}
            {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing content quality..."}
            {analysisProgress >= 90 && "Finalizing analysis..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Authentication Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Please log in to view resume preview and analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!resumeData && !resumeFile && !resumeId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Resume Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            Upload a resume to see the preview and analysis
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* PDF Preview */}
      {isPDFFile() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Document Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PDFPreview
              file={resumeFile}
              fileUrl={previewUrl}
              className="w-full max-w-md mx-auto"
            />
          </CardContent>
        </Card>
      )}

      {/* Overall Score */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Resume Analysis
              </div>
              <div className="flex space-x-2">
                {previewUrl && (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm bg-white hover:bg-gray-50 rounded transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </a>
                )}
                {previewUrl && (
                  <a
                    href={previewUrl}
                    download
                    className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm bg-white hover:bg-gray-50 rounded transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </a>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                  {analysis.score}/100
                </div>
                <div className="text-sm text-gray-600">Overall Score</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                  {analysis.atsScore}/100
                </div>
                <div className="text-sm text-gray-600">ATS Compatibility</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Content Preview */}
      {resumeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Resume Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Personal Info */}
            {resumeData.personalInfo && (
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="text-sm space-y-1 bg-gray-50 p-3 rounded">
                  <div><strong>{resumeData.personalInfo.name}</strong></div>
                  <div>{resumeData.personalInfo.email}</div>
                  <div>{resumeData.personalInfo.phone}</div>
                  <div>{resumeData.personalInfo.location}</div>
                </div>
              </div>
            )}

            {/* Summary */}
            {resumeData.summary && (
              <div>
                <h4 className="font-medium mb-2">Summary</h4>
                <div className="text-sm bg-gray-50 p-3 rounded">
                  {resumeData.summary}
                </div>
              </div>
            )}

            {/* Skills */}
            {resumeData.skills && resumeData.skills.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {resumeData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Experience Summary */}
            {resumeData.experience && resumeData.experience.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Experience ({resumeData.experience.length} positions)</h4>
                <div className="space-y-2">
                  {resumeData.experience.slice(0, 2).map((exp, index) => (
                    <div key={index} className="text-sm bg-gray-50 p-3 rounded">
                      <div className="font-medium">{exp.title}</div>
                      <div className="text-gray-600">{exp.company} • {exp.duration}</div>
                    </div>
                  ))}
                  {resumeData.experience.length > 2 && (
                    <div className="text-sm text-gray-500">
                      +{resumeData.experience.length - 2} more positions
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="w-5 h-5 mr-2" />
              Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Strengths */}
            <div>
              <h4 className="font-medium mb-2 flex items-center text-green-600">
                <CheckCircle className="w-4 h-4 mr-1" />
                Strengths
              </h4>
              <ul className="text-sm space-y-1">
                {analysis.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div>
              <h4 className="font-medium mb-2 flex items-center text-yellow-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Areas for Improvement
              </h4>
              <ul className="text-sm space-y-1">
                {analysis.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-yellow-500 mr-2">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>

            {/* Keywords */}
            <div>
              <h4 className="font-medium mb-2">Key Terms Found</h4>
              <div className="flex flex-wrap gap-1">
                {analysis.keywords.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ResumePreview; 