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
          <div className="bg-[#1C1C1E] p-8 rounded-[2rem] max-w-lg w-full shadow-2xl border border-zinc-800 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white mb-3">Ops! Encontramos um problema.</h1>
            <p className="text-zinc-400 mb-6 max-w-md">
              Desculpe, ocorreu um erro inesperado em nosso sistema. Nossa equipe técnica já pode ter sido notificada.
            </p>
            <div className="bg-zinc-950/50 p-4 rounded-xl text-left overflow-auto w-full mb-6 border border-zinc-800/50">
              <p className="text-sm text-red-400 font-mono break-words">
                {this.state.error?.toString()}
              </p>
              {this.state.error?.stack && (
                <details className="mt-2">
                  <summary className="text-xs text-zinc-500 cursor-pointer select-none">Mostrar detalhes técnicos</summary>
                  <pre className="text-[10px] text-zinc-500 mt-2 whitespace-pre-wrap font-mono">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.hash = ''; // Clear route state
                window.location.reload();
              }}
              className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors w-full"
            >
              Recarregar Página e Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
