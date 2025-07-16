import * as React from "react"
import { Progress } from "../ui/progress"

interface LoadingSpinnerProps {
  progress?: number;
  message?: string;
  showProgress?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  progress: externalProgress,
  message = "Loading...",
  showProgress = true
}) => {
  const [internalProgress, setInternalProgress] = React.useState(13)

  React.useEffect(() => {
    if (externalProgress !== undefined) return;

    const timer = setInterval(() => {
      setInternalProgress((prevProgress) => 
        prevProgress >= 100 ? 13 : prevProgress + 13
      )
    }, 500)

    return () => clearInterval(timer)
  }, [externalProgress])

  const currentProgress = externalProgress !== undefined ? externalProgress : internalProgress;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        {showProgress && (
          <Progress 
            className="w-56" 
            value={currentProgress} 
            aria-label="Loading progress"
          />
        )}
        <p className="text-sm text-gray-500">{message}</p>
        {showProgress && (
          <p className="text-xs text-gray-400" aria-live="polite">
            {Math.round(currentProgress)}%
          </p>
        )}
      </div>
    </div>
  )
} 