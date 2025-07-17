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
} from "lucide-react";
import httpClient from "@/httpClient";
import MainHeader from "../components/molecules/MainHeader";
import ResumePreview from "../components/molecules/ResumePreview";

export default function CVAnalysisPage() {
  const [analysisState, setAnalysisState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [user, setUser] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const resp = await httpClient.get("http://localhost:5000/auth/@me", {
          withCredentials: true,
        });
        setUser(resp.data);
      } catch (e) {
        console.log(e);
      }
    };

    fetchUser();
  }, []);

  const fetchCurrentUserResume = async () => {
    try {
      const response = await httpClient.get(
        "http://127.0.0.1:5000/resume/current",
        {
          withCredentials: true,
        }
      );
      if (response.data && response.data.filename) {
        setResumeUploaded(true);
        setResumeName(response.data.filename);
      }
    } catch (error) {
      console.error("Error trying to fetch current user resume.", error);
    }
  };

  const startAnalysis = () => {
    setAnalysisState("analyzing");
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(interval);
          setAnalysisState("complete");
          return 100;
        }
        return prevProgress + 10;
      });
    }, 500);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append("file", file);

        // Upload the file using POST request
        await httpClient.post("http://127.0.0.1:5000/resume/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true,
        });

        setResumeUploaded(true);
        setResumeName(file.name);
        setUploadedFile(file);
      } catch (error) {
        console.error("Error uploading the file:", error);
      }
    }
  };

  const handleDeleteResume = async () => {
    try {
      await httpClient.delete("http://127.0.0.1:5000/resume/current", {
        withCredentials: true,
      });
      setResumeUploaded(false);
      setResumeName("");
      setUploadedFile(null);
      setAnalysisState("idle");
    } catch (error) {
      console.error("Error deleting resume:", error);
    }
  };

  const handleAnalysisComplete = (analysis) => {
    console.log("Analysis completed:", analysis);
    // You can save the analysis results or update user profile here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      
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
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="resume-upload"
                      />
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <Upload className="w-12 h-12 text-gray-400" />
                        <div>
                          <p className="text-lg font-medium">Drop your resume here</p>
                          <p className="text-sm text-gray-500">
                            or click to browse (PDF, DOC, DOCX)
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
                            <p className="text-sm text-gray-600">{resumeName}</p>
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
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Analysis Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <p className="text-sm text-gray-600">
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
                resumeFile={uploadedFile}
                onAnalysisComplete={handleAnalysisComplete}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
