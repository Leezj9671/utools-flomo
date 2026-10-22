import { useEffect, useState } from 'react'
import { services } from '../lib/platform'
import { IconAlert, IconCheck } from './Icons'

interface Props {
  initial: string
  autoFocus?: boolean
  submitLabel: string
  onVerified: (url: string) => void
}

type State = { state: 'idle' } | { state: 'checking' } | { state: 'ok' } | { state: 'error'; message: string }

/** Paste → verify (without creating a memo) → hand the clean URL back. */
export function ApiField({ initial, autoFocus, submitLabel, onVerified }: Props) {
  const [value, setValue] = useState(initial)
  const [status, setStatus] = useState<State>({ state: 'idle' })
  const [fromClipboard, setFromClipboard] = useState(false)

  useEffect(() => {
    if (initial) return
    const found = services.clipboardApi()
    if (found) {
      setValue(found)
      setFromClipboard(true)
    }
  }, [initial])

  const parsed = services.parseApiUrl(value)

  const verify = async () => {
    if (status.state === 'checking') return
    if (!parsed) {
      setStatus({ state: 'error', message: '没有识别到 API 地址，它应该形如 https://flomoapp.com/iwh/…/…/' })
      return
    }
    setStatus({ state: 'checking' })
    const res = await services.verifyApi(parsed)
    if (!res.ok) {
      setStatus({ state: 'error', message: res.kind === 'invalid_api' ? 'flomo 不认这个地址：可能已重置，或复制不完整' : res.message })
      return
    }
    setStatus({ state: 'ok' })
    setTimeout(() => onVerified(res.url ?? parsed), 450)
  }

  return (
    <div className="api-field">
      <div className={'field' + (status.state === 'error' ? ' invalid' : '') + (status.state === 'ok' ? ' valid' : '')}>
        <input
          className="mono"
          value={value}
          autoFocus={autoFocus}
          placeholder="https://flomoapp.com/iwh/……/……/"
          spellCheck={false}
          onChange={(e) => {
            setValue(e.target.value)
            setFromClipboard(false)
            if (status.state !== 'idle') setStatus({ state: 'idle' })
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
              e.preventDefault()
              verify()
            }
          }}
        />
        <button type="button" className="btn primary" disabled={!value.trim() || status.state === 'checking'} onClick={verify}>
          {status.state === 'checking' ? (
            <>
              <span className="spinner" /> 验证中
            </>
          ) : status.state === 'ok' ? (
            <>
              <IconCheck width={15} height={15} /> 已连接
            </>
          ) : (
            submitLabel
          )}
        </button>
      </div>
      <p className={'field-note' + (status.state === 'error' ? ' error' : '')}>
        {status.state === 'error' ? (
          <>
            <IconAlert width={13} height={13} /> {status.message}
          </>
        ) : fromClipboard ? (
          '已从剪贴板识别到 API 地址，确认无误后按回车。'
        ) : value && parsed && parsed !== value.trim() ? (
          <>将使用：<span className="mono">{parsed}</span></>
        ) : (
          '验证只检查地址是否有效，不会在 flomo 里新建笔记。'
        )}
      </p>
    </div>
  )
}
