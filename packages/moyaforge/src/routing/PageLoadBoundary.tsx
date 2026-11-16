import { CircleAlert, RotateCw } from "lucide-react";
import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  type ReactNode,
} from "react";

export type ErrorBoundaryProps = PropsWithChildren<{
  message?: ReactNode;
  errorContext?: string;
  reloadButtonContent?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: ErrorInfo) => void;
}>;

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const { errorContext = "An unexpected error occurred", onError } =
      this.props;

    console.error(errorContext, error, info);
    onError?.(error, info);
  }

  private handleReload = () => {
    const url = new URL(window.location.href);

    url.searchParams.set("_asset_refresh", Date.now().toString());

    window.location.replace(url.href);
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const {
      message = "Reload the page to try again.",
      reloadButtonContent = "Reload page",
      fallback,
    } = this.props;

    if (fallback !== undefined) {
      return fallback;
    }

    return (
      <section
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem",
          padding: "1rem",
          marginBlock: "1rem",
          border: "1px solid color-mix(in srgb, currentColor 24%, transparent)",
          borderRadius: "0.75rem",
          background: "color-mix(in srgb, currentColor 4%, transparent)",
        }}
      >
        <CircleAlert size={20} aria-hidden="true" style={{ flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div role="alert">
            <strong>This page couldn’t load</strong>
            <div
              style={{ marginBlock: "0.375rem 0.75rem", fontSize: "0.875rem" }}
            >
              {message}
            </div>
          </div>
          <button
            type="button"
            onClick={this.handleReload}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              minHeight: "2.25rem",
              padding: "0.375rem 0.75rem",
              border:
                "1px solid color-mix(in srgb, currentColor 35%, transparent)",
              borderRadius: "0.5rem",
              background: "transparent",
              color: "inherit",
              font: "inherit",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            <RotateCw size={15} aria-hidden="true" />
            {reloadButtonContent}
          </button>
        </div>
      </section>
    );
  }
}
