import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const NoResumeAlert = () => {
  const [showAlert, setShowAlert] = useState(true);
  const navigate = useNavigate();

  return (
    showAlert && (
      <div className="fixed bottom-4 right-4 w-80 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100">
        <Alert variant="default">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Resume Not Uploaded</AlertTitle>
          <AlertDescription>
            Upload your resume and get free AI recommendations to improve it.
          </AlertDescription>

          <div className="mt-3 flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAlert(false)}
            >
              Dismiss
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/resume")}
            >
              Upload Resume
            </Button>
          </div>
        </Alert>
      </div>
    )
  );
};

export default NoResumeAlert;
