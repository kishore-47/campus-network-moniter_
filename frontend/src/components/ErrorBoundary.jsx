import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-900">
          <div className="max-w-2xl w-full bg-red-900/80 text-white p-6 rounded-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-sm mb-4">An unexpected error occurred in the UI. Details:</p>
            <pre className="text-xs whitespace-pre-wrap bg-black/30 p-3 rounded">{this.state.error?.toString()}</pre>
            <details className="mt-3 text-xs text-gray-200">
              <summary>Stack trace</summary>
              <pre className="text-xs whitespace-pre-wrap">{this.state.errorInfo?.componentStack}</pre>
            </details>
            <div className="mt-4">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 rounded">Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
