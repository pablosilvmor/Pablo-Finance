import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Ops! Algo deu errado.</h1>
          <p className="text-zinc-400 mb-6 max-w-md">
            Ocorreu um erro inesperado ao carregar a aplicação. Por favor, tente recarregar a página.
          </p>
          <div className="bg-zinc-900 p-4 rounded-lg text-left overflow-auto max-w-full">
            <pre className="text-xs text-red-400">
              {this.state.error?.message}
            </pre>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
