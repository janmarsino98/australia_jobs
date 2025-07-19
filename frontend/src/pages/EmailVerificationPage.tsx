import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "../components/ui/card";
import { LoadingSpinner } from "../components/molecules/LoadingSpinner";
import { motion } from "framer-motion";
import main_logo from "../imgs/logo.png";
import { CheckCircle, XCircle, Mail, RefreshCw } from "lucide-react";

const EmailVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'pending'>('pending');
  const [errorMessage, setErrorMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const token = searchParams.get('token');
  // Get email from either search params or navigation state (from signup)
  const email = searchParams.get('email') || location.state?.email;

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      setStatus('verifying');
      console.log('🔍 Verifying email with token');
      
      const response = await fetch(`http://localhost:5000/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: verificationToken,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to verify email');
      }

      console.log('✅ Email verified successfully');
      setStatus('success');
    } catch (error) {
      console.error('❌ Email verification failed:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Email verification failed');
    }
  };

  const resendVerification = async () => {
    if (!email || isResending || resendCooldown > 0) return;

    try {
      setIsResending(true);
      console.log('📧 Resending verification email to:', email);
      
      const response = await fetch(`http://localhost:5000/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to resend verification email');
      }

      console.log('✅ Verification email resent successfully');
      setResendCooldown(60); // 60 second cooldown
    } catch (error) {
      console.error('❌ Failed to resend verification email:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
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
        className="w-full max-w-md"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <Card className="shadow-lg border-navbar-border">
          <CardHeader className="space-y-6 text-center">
            <div className="flex justify-center">
              <div className="w-24 h-24 overflow-hidden mb-2">
                <img
                  src={main_logo}
                  alt="Logo"
                  className="rounded-full object-cover w-full h-full shadow-md"
                />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-main-text">
                Email Verification
              </h1>
              <p className="text-searchbar-text text-sm mt-2">
                {status === 'pending' && !token && "Check your email for the verification link"}
                {status === 'verifying' && "Verifying your email address..."}
                {status === 'success' && "Your email has been verified successfully"}
                {status === 'error' && "Email verification failed"}
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Verifying State */}
            {status === 'verifying' && (
              <div className="text-center space-y-4">
                <LoadingSpinner className="h-8 w-8 mx-auto" />
                <p className="text-searchbar-text">
                  Please wait while we verify your email address...
                </p>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-main-text mb-2">
                    Email Verified Successfully!
                  </h3>
                  <p className="text-searchbar-text text-sm">
                    Your account is now active. You can start using all features of AusJobs.
                  </p>
                </div>
                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Continue to Login
                </Button>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>
                <Alert variant="destructive">
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <p className="text-searchbar-text text-sm">
                    The verification link may have expired or been used already.
                  </p>
                  {email && (
                    <Button 
                      onClick={resendVerification}
                      variant="outline"
                      className="w-full"
                      disabled={isResending || resendCooldown > 0}
                    >
                      {isResending ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Resending...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend in {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Pending State (no token) */}
            {status === 'pending' && !token && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-main-text mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-searchbar-text text-sm">
                    We've sent a verification link to your email address. 
                    Click the link in your email to verify your account.
                  </p>
                </div>
                {email && (
                  <div className="space-y-3">
                    <p className="text-searchbar-text text-xs">
                      Didn't receive the email? Check your spam folder or request a new one.
                    </p>
                    <Button 
                      onClick={resendVerification}
                      variant="outline"
                      className="w-full"
                      disabled={isResending || resendCooldown > 0}
                    >
                      {isResending ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Resending...
                        </>
                      ) : resendCooldown > 0 ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Resend in {resendCooldown}s
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 mr-2" />
                          Resend Verification Email
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-center text-sm text-searchbar-text">
              Need help?{" "}
              <Link to="/about" className="text-pill-text hover:text-blue-700 font-medium">
                Contact Support
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default EmailVerificationPage; 