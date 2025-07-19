import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import useAuthStore from "../stores/useAuthStore";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";

const OAuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');
  const { checkSession } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check for error parameters in URL
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          setStatus('error');
          setErrorMessage(errorDescription || 'OAuth authentication failed');
          return;
        }

        // Check for success parameter or just verify session
        const success = searchParams.get('success');
        
        if (success === 'true') {
          // Backend has set the session, verify it
          const isValid = await checkSession();
          if (isValid) {
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
            }, 2000);
          } else {
            setStatus('error');
            setErrorMessage('Failed to verify authentication session');
          }
        } else {
          // Attempt to check session anyway (backend might have set it)
          const isValid = await checkSession();
          if (isValid) {
            setStatus('success');
            setTimeout(() => {
              navigate('/dashboard');
            }, 1500);
          } else {
            setStatus('error');
            setErrorMessage('Authentication was not completed successfully');
          }
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during authentication');
      }
    };

    handleCallback();
  }, [searchParams, checkSession, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <div className="min-h-screen bg-main-white-bg flex items-center justify-center px-6">
      <motion.div 
        className="w-full max-w-md text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="bg-white rounded-lg shadow-lg border-navbar-border p-8">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 overflow-hidden">
              <img
                src={main_logo}
                alt="Logo"
                className="rounded-full object-cover w-full h-full shadow-md"
              />
            </div>
          </div>

          {status === 'processing' && (
            <div className="space-y-4">
              <LoadingSpinner className="h-8 w-8 mx-auto" />
              <h2 className="text-xl font-semibold text-main-text">
                Completing Authentication
              </h2>
              <p className="text-searchbar-text">
                Please wait while we verify your credentials...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-main-text">
                Authentication Successful!
              </h2>
              <p className="text-searchbar-text">
                Welcome to AusJobs. You'll be redirected to your dashboard shortly.
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold text-main-text">
                Authentication Failed
              </h2>
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
              <Button 
                onClick={handleRetry}
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default OAuthCallbackPage; 