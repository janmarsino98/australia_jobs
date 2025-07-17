import { Button } from "../ui/button";
import useAuthStore from "../../stores/useAuthStore";

interface SocialLoginButtonsProps {
  className?: string;
}

const SocialLoginButtons = ({ className = "" }: SocialLoginButtonsProps) => {
  const { loginWithGoogle, loginWithLinkedIn } = useAuthStore();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error("Google login failed:", error);
    }
  };

  const handleLinkedInLogin = async () => {
    try {
      await loginWithLinkedIn();
    } catch (error) {
      console.error("LinkedIn login failed:", error);
    }
  };

  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      <Button
        variant="outline"
        type="button"
        className="flex items-center justify-center space-x-2"
        onClick={handleGoogleLogin}
      >
        <img
          className="h-5 w-5"
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google logo"
        />
        <span>Google</span>
      </Button>
      <Button
        variant="outline"
        type="button"
        className="flex items-center justify-center space-x-2"
        onClick={handleLinkedInLogin}
      >
        <img
          className="h-5 w-5"
          src="https://www.svgrepo.com/show/448234/linkedin.svg"
          alt="LinkedIn logo"
        />
        <span>LinkedIn</span>
      </Button>
    </div>
  );
};

export default SocialLoginButtons; 