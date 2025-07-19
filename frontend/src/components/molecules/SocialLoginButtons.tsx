import { useState } from "react";
import { Button } from "../ui/button";
import { LoadingSpinner } from "./LoadingSpinner";
import useAuthStore from "../../stores/useAuthStore";
import { useToast } from "../ui/use-toast";

interface SocialLoginButtonsProps {
  className?: string;
}

const SocialLoginButtons = ({ className = "" }: SocialLoginButtonsProps) => {
  const { loginWithGoogle, loginWithLinkedIn } = useAuthStore();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsGoogleLoading(true);
      await loginWithGoogle();
      // Note: This won't execute due to redirect, but good for consistency
    } catch (error) {
      console.error("Google login failed:", error);
      toast({
        title: "Login Failed",
        description: "Failed to initiate Google login. Please try again.",
        variant: "destructive",
      });
      setIsGoogleLoading(false);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      setIsLinkedInLoading(true);
      await loginWithLinkedIn();
      // Note: This won't execute due to redirect, but good for consistency
    } catch (error) {
      console.error("LinkedIn login failed:", error);
      toast({
        title: "Login Failed", 
        description: "Failed to initiate LinkedIn login. Please try again.",
        variant: "destructive",
      });
      setIsLinkedInLoading(false);
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <Button
        variant="outline"
        type="button"
        className="flex items-center justify-center space-x-2"
        onClick={handleGoogleLogin}
        disabled={isGoogleLoading || isLinkedInLoading}
      >
        {isGoogleLoading ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <img
              className="h-5 w-5"
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google logo"
            />
            <span>Google</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        type="button"
        className="flex items-center justify-center space-x-2"
        onClick={handleLinkedInLogin}
        disabled={isGoogleLoading || isLinkedInLoading}
      >
        {isLinkedInLoading ? (
          <>
            <LoadingSpinner className="h-4 w-4" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <img
              className="h-5 w-5"
              src="https://www.svgrepo.com/show/448234/linkedin.svg"
              alt="LinkedIn logo"
            />
            <span>LinkedIn</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default SocialLoginButtons; 