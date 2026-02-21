import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-slate-950 border border-rose-900/50 rounded-3xl animate-in fade-in duration-500 max-w-2xl mx-auto mt-10 shadow-[0_0_30px_rgba(225,29,72,0.15)]">
                    <div className="w-16 h-16 bg-rose-500/20 text-rose-500 flex items-center justify-center rounded-2xl mb-6 border border-rose-500/30">
                        <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-black text-rose-500 uppercase tracking-tighter mb-2 text-center">
                        Erro Inesperado na Renderização
                    </h2>
                    <p className="text-slate-400 font-medium text-center mb-8 max-w-md">
                        Identificamos dados inconsistentes ou uma falha de layout nesta tela. Para não travar o sistema inteiro, isolamos este erro.
                    </p>

                    <div className="w-full bg-slate-900/80 p-4 rounded-xl border border-slate-800 overflow-auto max-h-48 mb-6 mx-auto scrollbar-thin">
                        <p className="font-mono text-[10px] text-rose-400 whitespace-pre-wrap break-all">
                            {this.state.error && this.state.error.toString()}
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </p>
                    </div>

                    <button
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg hover:shadow-rose-500/20 active:scale-95"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Recarregar o Sistema
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
