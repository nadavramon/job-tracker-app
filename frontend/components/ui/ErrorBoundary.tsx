'use client';

import React from 'react';

interface Props {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface State {
    hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    private handleReset = () => {
        this.setState({ hasError: false });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex min-h-[300px] items-center justify-center p-8">
                    <div className="text-center space-y-4">
                        <h2 className="text-lg font-semibold text-(--foreground)">
                            Something went wrong
                        </h2>
                        <p className="text-sm text-(--muted-foreground)">
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="rounded-md bg-(--primary) px-4 py-2 text-sm font-medium text-(--primary-foreground) hover:opacity-90 transition-opacity"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
