import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error(`ErrorBoundary caught an error in ${this.props.componentName}:`, error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 bg-red-50 border border-red-200 rounded-2xl shadow-sm m-4 text-center">
                    <h2 className="text-xl font-extrabold text-red-700 mb-2">Something went wrong.</h2>
                    <p className="text-sm font-medium text-red-600 mb-4">Component crashed: {this.props.componentName}</p>
                    {this.props.showReload !== false && (
                        <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md hover:bg-red-700 transition-all">Reload Page</button>
                    )}
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;