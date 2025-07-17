import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { 
  FileText, 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Eye,
  Download
} from "lucide-react";
import { Button } from "../ui/button";

interface ResumeData {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
  };
  summary?: string;
  experience?: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills?: string[];
  certifications?: string[];
}

interface ResumeAnalysis {
  score: number;
  strengths: string[];
  improvements: string[];
  keywords: string[];
  atsScore: number;
  sections: {
    [key: string]: {
      present: boolean;
      quality: 'good' | 'fair' | 'needs_improvement';
      suggestions?: string[];
    };
  };
}

interface ResumePreviewProps {
  resumeFile?: File;
  resumeUrl?: string;
  onAnalysisComplete?: (analysis: ResumeAnalysis) => void;
  className?: string;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  resumeFile, 
  resumeUrl,
  onAnalysisComplete,
  className = "" 
}) => {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Mock resume parsing function (in real implementation, this would call an API)
  const parseResume = async (file?: File): Promise<ResumeData> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock parsed data - in real implementation, this would come from PDF/DOC parsing
    return {
      personalInfo: {
        name: "John Doe",
        email: "john.doe@email.com",
        phone: "+61 400 123 456",
        location: "Sydney, NSW"
      },
      summary: "Experienced software developer with 5+ years in full-stack development, specializing in React and Node.js. Passionate about creating user-centric applications and driving digital transformation.",
      experience: [
        {
          title: "Senior Software Developer",
          company: "Tech Solutions Pty Ltd",
          duration: "2021 - Present",
          description: "Led development of customer-facing web applications using React and Node.js. Improved application performance by 40% and reduced load times by 60%."
        },
        {
          title: "Software Developer",
          company: "Digital Innovations",
          duration: "2019 - 2021",
          description: "Developed and maintained multiple web applications. Collaborated with cross-functional teams to deliver high-quality software solutions."
        }
      ],
      education: [
        {
          degree: "Bachelor of Computer Science",
          institution: "University of Sydney",
          year: "2019"
        }
      ],
      skills: ["JavaScript", "React", "Node.js", "Python", "SQL", "AWS", "Git", "Agile"],
      certifications: ["AWS Certified Solutions Architect", "Scrum Master Certification"]
    };
  };

  // Mock analysis function
  const analyzeResume = async (data: ResumeData): Promise<ResumeAnalysis> => {
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      score: 82,
      atsScore: 78,
      strengths: [
        "Strong technical skills section",
        "Quantified achievements in experience",
        "Relevant education and certifications",
        "Professional summary is concise and impactful"
      ],
      improvements: [
        "Add more action verbs in experience descriptions",
        "Include relevant keywords for target jobs",
        "Consider adding a projects section",
        "Improve formatting consistency"
      ],
      keywords: ["JavaScript", "React", "Node.js", "Full-stack", "Software Development"],
      sections: {
        personalInfo: { present: true, quality: 'good' },
        summary: { present: true, quality: 'good' },
        experience: { 
          present: true, 
          quality: 'fair',
          suggestions: ["Add more quantified achievements", "Use stronger action verbs"]
        },
        education: { present: true, quality: 'good' },
        skills: { 
          present: true, 
          quality: 'good',
          suggestions: ["Consider organizing skills by category"]
        },
        certifications: { present: true, quality: 'good' }
      }
    };
  };

  useEffect(() => {
    if (resumeFile || resumeUrl) {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      const runAnalysis = async () => {
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
          
          const analysisResult = await analyzeResume(parsedData);
          setAnalysis(analysisResult);
          
          clearInterval(progressInterval);
          setAnalysisProgress(100);
          
          onAnalysisComplete?.(analysisResult);
        } catch (error) {
          console.error('Error analyzing resume:', error);
        } finally {
          setIsAnalyzing(false);
        }
      };

      runAnalysis();
    }
  }, [resumeFile, resumeUrl, onAnalysisComplete]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityBadge = (quality: string) => {
    const colors = {
      good: 'bg-green-100 text-green-800',
      fair: 'bg-yellow-100 text-yellow-800',
      needs_improvement: 'bg-red-100 text-red-800'
    };
    return colors[quality as keyof typeof colors] || colors.fair;
  };

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

  if (!resumeData || !analysis) {
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
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Resume Analysis
            </div>
            <div className="flex space-x-2">
              <button 
                type="button"
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm bg-white hover:bg-gray-50 rounded transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View
              </button>
              <button 
                type="button"
                className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm bg-white hover:bg-gray-50 rounded transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </button>
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

      {/* Parsed Content Preview */}
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

          {/* Skills */}
          {resumeData.skills && (
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
          {resumeData.experience && (
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

      {/* Analysis Results */}
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
    </div>
  );
};

export default ResumePreview; 