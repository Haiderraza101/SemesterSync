import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error(error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="error-screen" role="alert">
        <h1>Something went wrong</h1>
        <p className="text-muted">An unexpected error stopped this page from loading. Reload to try again.</p>
        <button type="button" className="btn btn--primary btn--lg" onClick={this.handleReload}>
          Reload page
        </button>
      </main>
    );
  }
}
