import { Component } from 'react'

// Catches JS errors anywhere in the child component tree
// and shows a fallback UI instead of crashing the whole page
export default class ErrorBoundary extends Component {
  state = { hasError: false, message: '' }

  static getDerivedStateFromError(err) {
    return { hasError: true, message: err.message }
  }

  componentDidCatch(err, info) {
    console.error('[ErrorBoundary]', err, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 bg-[#0d0d14] text-center px-6">
          <p className="text-red-400 font-medium">Something went wrong</p>
          <p className="text-slate-500 text-xs font-mono">{this.state.message}</p>
          <button
            className="btn-ghost text-xs mt-2"
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
