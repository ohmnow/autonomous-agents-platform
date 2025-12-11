'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs the errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console (in production, send to error tracking service)
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // TODO: Send to error tracking service like Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle>Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                An unexpected error occurred. Please try again or return to the
                dashboard.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="max-h-32 overflow-auto rounded-md bg-zinc-100 p-3 text-xs text-red-600 dark:bg-zinc-900">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={this.handleReset}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button className="flex-1" asChild>
                  <a href="/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Dashboard
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Inline error display for smaller errors
 */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{message}</span>
      {onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * Full-page error display
 */
export function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred.',
  showDashboardLink = true,
  onRetry,
}: {
  title?: string;
  message?: string;
  showDashboardLink?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
        <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-300" />
      </div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="max-w-md text-muted-foreground">{message}</p>
      <div className="flex gap-2">
        {onRetry && (
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
        {showDashboardLink && (
          <Button asChild>
            <a href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Not Found error display
 */
export function NotFoundError({
  resourceName = 'Resource',
  backLink = '/dashboard',
  backLabel = 'Go to Dashboard',
}: {
  resourceName?: string;
  backLink?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4 p-8 text-center">
      <div className="text-6xl">🔍</div>
      <h2 className="text-xl font-semibold">{resourceName} not found</h2>
      <p className="max-w-md text-muted-foreground">
        The {resourceName.toLowerCase()} you&apos;re looking for doesn&apos;t
        exist or has been removed.
      </p>
      <Button asChild>
        <a href={backLink}>{backLabel}</a>
      </Button>
    </div>
  );
}
