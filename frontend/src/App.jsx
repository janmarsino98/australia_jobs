import { RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import routes from "./routes";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/toast";
import useAuthStore from "./stores/useAuthStore";

function App() {
  const initialize = useAuthStore((state) => state.initialize);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      }
    };
    
    initAuth();
  }, [initialize]);

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
