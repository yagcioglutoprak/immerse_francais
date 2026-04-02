import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-lg text-center">
          <p className="font-display text-lg text-error dark:text-error-dark mb-sm">
            Something went wrong
          </p>
          <p className="text-sm text-ink-muted dark:text-warm-muted mb-md">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            className="btn-ghost text-sm"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
