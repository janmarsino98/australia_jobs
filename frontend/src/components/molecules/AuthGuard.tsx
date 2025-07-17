import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../stores/useAuthStore';
import { LoadingSpinner } from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const AuthGuard = ({ children, allowedRoles = [] }: AuthGuardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, refreshSession } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isAuthenticated) {
          await refreshSession();
        }
      } catch (error) {
        navigate('/login', {
          state: { from: location.pathname }
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [isAuthenticated, navigate, location, refreshSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="w-8 h-8" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login', {
      state: { from: location.pathname }
    });
    return null;
  }

  // Skip role check if no roles are required or user has no role
  if (allowedRoles.length > 0 && !user?.roles?.some(role => allowedRoles.includes(role))) {
    navigate('/unauthorized');
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard; 