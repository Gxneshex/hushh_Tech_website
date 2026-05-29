import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  beginPlaidSession,
  logPlaidEvent,
} from '../services/plaid/plaidDiagnostics';

const isDevelopment = import.meta.env.DEV;

const MAX_STACK_BYTES = 4_000;
const MAX_COMPONENT_STACK_BYTES = 2_000;

const truncate = (value: string | undefined, limit: number): string | null => {
  if (!value) return null;
  return value.length > limit ? value.slice(0, limit) : value;
};

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  diagnosticId?: string | null;
  copied?: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);

    // Reuse the diagnostics session id so a support handoff can quote one
    // short string and the team can grep the exact crash row. Wrapped so a
    // failing diagnostics dependency cannot itself break the fallback.
    let diagnosticId: string | null = null;
    try {
      diagnosticId = beginPlaidSession();
    } catch (sessionErr) {
      console.warn('[ErrorBoundary] beginPlaidSession failed', sessionErr);
    }

    try {
      logPlaidEvent('uncaught_react_error', {
        errorDetails: {
          message: error?.message ? truncate(error.message, 1024) : null,
          name: error?.name ?? null,
          stack: truncate(error?.stack, MAX_STACK_BYTES),
          componentStack: truncate(
            errorInfo?.componentStack ?? undefined,
            MAX_COMPONENT_STACK_BYTES,
          ),
        },
        pageState: {
          pathname:
            typeof window !== 'undefined' ? window.location.pathname : null,
          search:
            typeof window !== 'undefined' ? window.location.search : null,
          documentTitle:
            typeof document !== 'undefined'
              ? truncate(document.title, 256)
              : null,
        },
      });
    } catch (logErr) {
      console.warn('[ErrorBoundary] diagnostics emit failed', logErr);
    }

    this.setState({ diagnosticId });
  }

  copyDiagnosticId = () => {
    const id = this.state.diagnosticId;
    if (!id) return;
    try {
      void navigator.clipboard?.writeText?.(id);
      this.setState({ copied: true });
    } catch {
      // Clipboard API unavailable — let the user select the text manually.
    }
  };

  render() {
    if (this.state.hasError) {
      const diagnosticId = this.state.diagnosticId;
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 max-w-md" role="alert">
            <div className="mb-6">
              <svg
                aria-hidden="true"
                className="mx-auto h-16 w-16 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We're sorry for the inconvenience. Please refresh the page to continue.
            </p>
            {this.state.error && isDevelopment && (
              <details className="mb-6 text-left bg-gray-100 p-4 rounded-lg">
                <summary className="cursor-pointer font-semibold text-gray-700 mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs text-red-600 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.error.stack}
                </pre>
              </details>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Refresh Page
            </button>
            {diagnosticId && (
              <div className="mt-6">
                <p className="text-xs text-gray-500">
                  Need help from support? Share this diagnostic ID so we can
                  look up the exact crash in our logs:
                </p>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-mono text-gray-700">
                  <span data-testid="error-diagnostic-id">{diagnosticId}</span>
                  <button
                    type="button"
                    onClick={this.copyDiagnosticId}
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    {this.state.copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
