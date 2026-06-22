import { useState, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function AppErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="max-w-lg w-full bg-bg-surface border border-border-default rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-danger/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-accent-danger text-[32px]">error</span>
        </div>
        <h1 className="font-h1 text-h1 text-text-primary mb-2">Something went wrong</h1>
        <p className="font-body text-body text-text-secondary mb-4">
          An unexpected error occurred in the application. Please try again or contact support.
        </p>
        <div className="bg-bg-input border border-border-default rounded-lg p-4 mb-6 text-left">
          <p className="font-mono text-mono text-accent-danger text-sm break-all">{error.message}</p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="h-10 px-5 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-5 rounded-lg border border-border-default text-text-primary font-table text-table hover:bg-bg-hover transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

export function RouteErrorBoundary() {
  const { resetBoundary } = useErrorBoundary();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary p-6">
      <div className="max-w-lg w-full bg-bg-surface border border-border-default rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-warning/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-accent-warning text-[32px]">warning</span>
        </div>
        <h1 className="font-h1 text-h1 text-text-primary mb-2">Page Error</h1>
        <p className="font-body text-body text-text-secondary mb-6">
          This page failed to load. The error has been logged.
        </p>
        <button
          onClick={resetBoundary}
          className="h-10 px-5 rounded-lg bg-accent-primary text-white font-table text-table hover:bg-accent-primary-dim transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

export function ApiErrorHandler() {
  const [lastError, setLastError] = useState<Error | null>(null);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      console.error("[Global Error]", event.error);
      setLastError(event.error);
    }

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (!lastError) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[90] max-w-sm bg-bg-elevated border border-accent-danger/20 rounded-lg p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined text-accent-danger text-[20px]">error</span>
        <div>
          <p className="font-table text-table text-text-primary">An error occurred</p>
          <p className="font-mono text-mono text-[11px] text-text-muted mt-1">{lastError.message}</p>
        </div>
        <button
          onClick={() => setLastError(null)}
          className="text-text-muted hover:text-text-primary"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </div>
  );
}
