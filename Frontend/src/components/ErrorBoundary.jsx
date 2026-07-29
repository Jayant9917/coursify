import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      ready: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled rendering error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidMount() {
    this.setState({ ready: true });
  }

  render() {
    const { hasError, ready } = this.state;

    if (!ready) {
      return <LoadingSpinner label="Loading application..." />;
    }

    if (hasError) {
      return (
        <div className="page-shell flex min-h-screen items-center justify-center py-10">
          <Card className="w-full max-w-2xl border-slate-200 p-8 text-center shadow-lg">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-3xl font-black text-slate-950">Something went wrong</h1>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button onClick={() => window.location.reload()}>
                <RefreshCcw className="h-4 w-4" />
                Reload Page
              </Button>
            </div>

          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
