import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';
import config from '../../config';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const AuthGuard = ({ children, allowedRoles = [] }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, checkSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // If authentication is disabled for testing, bypass all auth checks
    if (config.disableAuthForTesting) {
      setIsLoading(false);
      setAuthChecked(true);
      return;
    }
    const checkAuth = async () => {
      try {
        console.log('🛡️ AuthGuard checking authentication...');
        
        // If not authenticated, try to check session
        if (!isAuthenticated) {
          const sessionValid = await checkSession();
          if (!sessionValid) {
            console.log('🚫 Session invalid, redirecting to login');
            navigate('/login', {
              state: { from: location.pathname }
            });
            return;
          }
        }
        
        console.log('✅ AuthGuard: User is authenticated');
      } catch (error) {
        console.error('❌ AuthGuard: Session check failed:', error);
        navigate('/login', {
          state: { from: location.pathname }
        });
        return;
      } finally {
        setIsLoading(false);
        setAuthChecked(true);
      }
    };

    // Only run auth check once per mount or when authentication status changes
    if (!authChecked) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated, authChecked, checkSession, navigate, location.pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  // If authentication is disabled for testing, bypass all auth checks
  if (config.disableAuthForTesting) {
    return <>{children}</>;
  }

  // If still not authenticated after checks, redirect to login
  if (!isAuthenticated) {
    navigate('/login', {
      state: { from: location.pathname }
    });
    return null;
  }

  // Check user roles if specified
  if (allowedRoles.length > 0 && user?.role && !allowedRoles.includes(user.role)) {
    navigate('/unauthorized');
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard; 