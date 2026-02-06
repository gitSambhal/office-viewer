import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{}, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: React.PropsWithChildren<{}>;

  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-white p-12 text-center">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-black mb-2 uppercase tracking-tighter">
            Application Crash
          </h1>
          <p className="text-zinc-500 max-w-md text-sm mb-8">
            {this.state.error?.message ||
              'An unexpected error occurred during initialization.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-white text-black rounded-xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-zinc-200 transition-all"
          >
            Reload Workstation
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
