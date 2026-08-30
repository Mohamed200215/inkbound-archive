import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it so a bug in one section (a bad
 * API response shape, a null the UI didn't expect) shows a recoverable
 * screen instead of a blank white page. React error boundaries must be
 * class components — there's no hook equivalent.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled error in the app tree:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center dark:bg-neutral-950">
          <p className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
            Something went wrong
          </p>
          <p className="max-w-sm text-sm text-neutral-500">
            The page hit an unexpected error. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-teal-500/40 px-4 py-2 text-sm font-medium text-teal-700 transition-colors hover:border-teal-500/70 dark:border-teal-400/30 dark:text-teal-300 dark:hover:border-teal-400/60"
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
