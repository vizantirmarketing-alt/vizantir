'use client'

import { Component, type ReactNode } from 'react'

interface EngineErrorBoundaryProps {
  children: ReactNode
  fallback: ReactNode
}

interface EngineErrorBoundaryState {
  failed: boolean
}

export class EngineErrorBoundary extends Component<EngineErrorBoundaryProps, EngineErrorBoundaryState> {
  state: EngineErrorBoundaryState = { failed: false }

  static getDerivedStateFromError(): EngineErrorBoundaryState {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return this.props.fallback
    return this.props.children
  }
}
