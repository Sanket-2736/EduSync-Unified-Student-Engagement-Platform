"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Card } from "./ui/Card";
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
  /** Label shown on the reset button */
  resetLabel?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to an error tracking service (e.g. Sentry)
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card padding="lg" className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-red-50 rounded-full">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 text-sm mb-2">
              An unexpected error occurred. This has been logged and we'll look
              into it.
            </p>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre className="text-left text-xs bg-gray-100 rounded-lg p-3 mb-4 overflow-auto max-h-32 text-red-700">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button
                variant="primary"
                onClick={this.handleReset}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {this.props.resetLabel ?? "Try Again"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => (window.location.href = "/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Convenience wrapper for use in page files.
 * Usage:
 *   <WithErrorBoundary>
 *     <MyPage />
 *   </WithErrorBoundary>
 */
export function WithErrorBoundary({
  children,
  resetLabel,
}: {
  children: ReactNode;
  resetLabel?: string;
}) {
  return (
    <ErrorBoundary resetLabel={resetLabel}>{children}</ErrorBoundary>
  );
}
