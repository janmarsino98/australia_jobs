import { RouterProvider } from "react-router-dom";
import routes from "./routes";
import { Toaster } from "./components/ui/toaster";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ToastProvider } from "./components/ui/toast";

function App() {
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
