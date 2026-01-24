import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
                    <h1 className="text-4xl font-bold text-red-500 mb-4">Algo deu errado!</h1>
                    <p className="text-xl mb-4">Ocorreu um erro inesperado na aplicação.</p>
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 max-w-2xl w-full overflow-auto text-left font-mono">
                        <p className="text-red-400 font-bold">{this.state.error && this.state.error.toString()}</p>
                        <div className="text-gray-500 text-xs mt-2 whitespace-pre-wrap">
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </div>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-neon-green text-black font-bold rounded-lg hover:bg-green-400 transition"
                    >
                        Recarregar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
