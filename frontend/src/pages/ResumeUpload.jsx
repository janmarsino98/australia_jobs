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

export default function CVAnalysisPage() {
  const [analysisState, setAnalysisState] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [resumeName, setResumeName] = useState("");
  const [user, setUser] = useState(null);

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

  // useEffect(() => {
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

  //   fetchCurrentUserResume();
  // }, [user]);

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
      setAnalysisState("idle");
      setProgress(0);
    } catch (error) {
      console.error("Error deleting the resume:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <MainHeader />

      <main className="flex-1 p-6 bg-gradient-to-b from-white to-gray-100">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="text-center">
            <h1 className="text-4xl font-bold tracking-tighter text-gray-800 mb-4">
              AI-Powered CV Analysis
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Get instant feedback and improvement suggestions for your CV
            </p>
          </section>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                {resumeUploaded ? "Your Resume" : "Upload Your CV"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {resumeUploaded ? (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="font-medium text-gray-700">
                      {resumeName}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteResume}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span>{" "}
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, DOCX (MAX. 5MB)
                      </p>
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              )}
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={
                  resumeUploaded
                    ? startAnalysis
                    : () => document.getElementById("dropzone-file")?.click()
                }
                disabled={analysisState === "analyzing"}
              >
                {resumeUploaded
                  ? analysisState === "idle"
                    ? "Analyze CV"
                    : analysisState === "analyzing"
                    ? "Analyzing..."
                    : "Analysis Complete"
                  : "Upload Resume"}
              </Button>
            </CardContent>
          </Card>

          {analysisState !== "idle" && resumeUploaded && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full" />
                <p className="mt-2 text-center text-sm text-gray-600">
                  {analysisState === "analyzing"
                    ? `${progress}% complete`
                    : "Analysis complete!"}
                </p>
              </CardContent>
            </Card>
          )}

          {analysisState === "complete" && resumeUploaded && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" />
                    <span>Strong professional summary</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="text-yellow-500" />
                    <span>Consider adding more quantifiable achievements</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="text-green-500" />
                    <span>Good use of action verbs</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="text-yellow-500" />
                    <span>Skills section could be more comprehensive</span>
                  </div>
                </div>
                <Button className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white">
                  View Detailed Report
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-gray-800 text-white py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center">
          <div className="text-sm mb-4 sm:mb-0">
            © 2024 AusJobs. All rights reserved.
          </div>
          <div className="flex space-x-4">
            <a href="#" className="text-sm hover:text-blue-300">
              Privacy
            </a>
            <a href="#" className="text-sm hover:text-blue-300">
              Terms
            </a>
            <a href="#" className="text-sm hover:text-blue-300">
              Cookies
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
