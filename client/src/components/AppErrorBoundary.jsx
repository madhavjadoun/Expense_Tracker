import React from "react";

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("[AppErrorBoundary] Runtime error:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#020617] px-6 text-center text-white/85">
          <div>
            <div className="text-lg font-semibold">Something went wrong</div>
            <div className="mt-2 text-sm text-white/60">
              Please refresh once. If it continues, restart dev server.
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
