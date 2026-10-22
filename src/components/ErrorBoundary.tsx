import { Component, type ReactNode } from 'react'
import { report } from '../lib/devlog'
import { IconAlert } from './Icons'

/** Shows what broke instead of leaving the uTools panel blank. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    report('render', { error, componentStack: info.componentStack })
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    return (
      <div className="crash">
        <IconAlert width={18} height={18} />
        <div>
          <h1>插件出错了</h1>
          <p>你写的内容已自动保存在草稿里。把下面的信息发给开发者可以帮助修复：</p>
          <pre>{`${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(1, 6).join('\n')}`}</pre>
          <button type="button" className="btn ghost" onClick={() => this.setState({ error: null })}>
            重试
          </button>
        </div>
      </div>
    )
  }
}
