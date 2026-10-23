import { Component, type ReactNode } from 'react';

/** Renders `fallback` instead of crashing the page when a child throws (e.g. WebGL unavailable). */
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children;
  }
}
