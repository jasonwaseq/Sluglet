'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-blue-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white mb-4">
              Something went wrong
            </h1>
            <p className="text-blue-200 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="px-6 py-3 bg-yellow-500 text-blue-900 rounded-lg hover:bg-yellow-400 transition font-semibold"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 