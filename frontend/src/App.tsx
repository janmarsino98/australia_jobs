import { RouterProvider } from "react-router-dom";
import { useEffect, useState } from "react";
import routes from "./routes";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/toast";
import useAuthStore from "./stores/useAuthStore";
import { LoadingSpinner } from "./components/molecules/LoadingSpinner";

function App() {
  const initialize = useAuthStore((state) => state.initialize);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initAuth();
  }, [initialize]);

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ToastProvider>
      <ErrorBoundary>
        <RouterProvider router={routes} />
        <Toaster />
      </ErrorBoundary>
    </ToastProvider>
  );
}

export default App;
