import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { composeMemo, hostOf, tagsInText } from '../lib/compose'
import { modKey, services, utools } from '../lib/platform'
import { clearDraft, rememberTags, saveDraft, type Draft, type Settings } from '../lib/store'
import { IconAlert, IconCheck, IconClose, IconLink, IconSettings } from './Icons'
import { TagInput } from './TagInput'

export interface Seed extends Draft {
  /** Changes on every plugin entry so the composer re-seeds even for identical payloads. */
  id: number
  /** Browser URL captured on entry, used when the text is turned into an excerpt. */
  sourceHint: Promise<string>
}

interface Props {
  seed: Seed
  api: string
  settings: Settings
  recentTags: string[]
  onOpenSettings: () => void
  onSent: () => void
}

type Status = { state: 'idle' } | { state: 'sending' } | { state: 'sent' } | { state: 'error'; kind: SendErrorKind; message: string }

const ERROR_HINT: Partial<Record<SendErrorKind, string>> = {
  invalid_api: 'API 地址已失效或被重置，请到 flomo 重新复制。',
  not_pro: 'flomo API 需要 PRO 会员。',
  network: '内容已保存在草稿里，网络恢复后再发送即可。',
  rate_limited: '发送太频繁了，稍等几秒再试。',
}

function useAutoGrow(ref: React.RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [ref, value])
}

export function Composer({ seed, api, settings, recentTags, onOpenSettings, onSent }: Props) {
  const [text, setText] = useState(seed.text)
  const [quote, setQuote] = useState(seed.quote)
  const [source, setSource] = useState(seed.source)
  const [tags, setTags] = useState(seed.tags)
  const [sourceHint, setSourceHint] = useState('')
  const [markdown, setMarkdown] = useState(settings.markdown)
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const textRef = useRef<HTMLTextAreaElement>(null)
  const quoteRef = useRef<HTMLTextAreaElement>(null)

  useAutoGrow(textRef, text)
  useAutoGrow(quoteRef, quote)

  // Re-seed whenever the plugin is entered again.
  useEffect(() => {
    setText(seed.text)
    setQuote(seed.quote)
    setSource(seed.source)
    setTags(seed.tags)
    setStatus({ state: 'idle' })
    utools.subInputBlur()
    const el = textRef.current
    if (el) {
      el.focus()
      el.setSelectionRange(el.value.length, el.value.length)
    }
    setSourceHint('')
    let alive = true
    seed.sourceHint.then((url) => alive && setSourceHint(url))
    return () => {
      alive = false
    }
  }, [seed])

  useEffect(() => saveDraft({ text, quote, source, tags }), [text, quote, source, tags])

  const content = useMemo(
    () => composeMemo({ text, quote, source, tags, markdown }),
    [text, quote, source, tags, markdown],
  )
  const empty = !text.trim() && !quote.trim()
  const excerpt = Boolean(quote)

  // 摘录: the text becomes a 「quote」 with its source link, and the editor is freed for
  // your own thoughts. Toggling back folds everything into plain text again.
  const toggleExcerpt = () => {
    if (excerpt) {
      setText([quote.trim(), text.trim()].filter(Boolean).join('\n\n'))
      setQuote('')
      setSource('')
    } else if (text.trim()) {
      setQuote(text.trim())
      setText('')
      if (settings.withSource) setSource(sourceHint)
    }
    textRef.current?.focus()
  }
  const busy = status.state === 'sending' || status.state === 'sent'

  const send = async () => {
    if (empty || busy) return
    setStatus({ state: 'sending' })
    const result = await services.sendMemo(api, content, { markdown })
    if (!result.ok) {
      setStatus({ state: 'error', kind: result.kind, message: result.message })
      return
    }
    rememberTags([...tags, ...tagsInText(text)])
    clearDraft()
    setStatus({ state: 'sent' })
    setTimeout(() => {
      if (settings.autoHide) {
        utools.hideMainWindow()
        utools.outPlugin()
      }
      onSent()
    }, 650)
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      send()
    } else if (e.key.toLowerCase() === 'e' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
      e.preventDefault()
      toggleExcerpt()
    } else if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      onOpenSettings()
    }
  }

  const suggestions = useMemo(
    () => [...new Set([...settings.defaultTags, ...recentTags])],
    [settings.defaultTags, recentTags],
  )

  return (
    <div className="composer" onKeyDown={onKeyDown}>
      {excerpt ? (
        <figure className="quote">
          <textarea
            ref={quoteRef}
            className="quote-text"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            rows={1}
            spellCheck={false}
            aria-label="摘录原文"
          />
          {source && (
            <figcaption className="source">
              <IconLink width={13} height={13} />
              <span className="source-host" title={source}>
                {hostOf(source)}
              </span>
              <button type="button" className="icon-btn tiny" aria-label="不附带来源" onClick={() => setSource('')}>
                <IconClose width={12} height={12} />
              </button>
            </figcaption>
          )}
        </figure>
      ) : null}

      <textarea
        ref={textRef}
        className="editor"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          if (status.state === 'error') setStatus({ state: 'idle' })
        }}
        placeholder={quote ? '写下你的想法…' : '现在的想法是…'}
        rows={quote ? 2 : 4}
        aria-label="笔记内容"
      />

      <TagInput tags={tags} onChange={setTags} suggestions={suggestions} onSubmit={send} />

      {status.state === 'error' && (
        <div className="notice error" role="alert">
          <IconAlert width={15} height={15} />
          <span>
            <strong>{status.message}</strong>
            {ERROR_HINT[status.kind] && <span className="notice-hint">{ERROR_HINT[status.kind]}</span>}
          </span>
          {status.kind === 'invalid_api' ? (
            <button type="button" className="link-btn" onClick={onOpenSettings}>
              重新设置
            </button>
          ) : (
            <button type="button" className="link-btn" onClick={send}>
              重试
            </button>
          )}
        </div>
      )}

      <footer className="bar">
        <div className="bar-left">
          <button type="button" className="icon-btn" title={`设置（${modKey} ,）`} aria-label="设置" onClick={onOpenSettings}>
            <IconSettings />
          </button>
          <button
            type="button"
            className={'pill' + (markdown ? ' on' : '')}
            title="以 Markdown 格式发送"
            aria-pressed={markdown}
            onClick={() => setMarkdown(!markdown)}
          >
            MD
          </button>
          <button
            type="button"
            className={'pill text' + (excerpt ? ' on' : '')}
            title={`作为摘录：原文加「」并附上来源（${modKey} E）`}
            aria-pressed={excerpt}
            disabled={empty}
            onClick={toggleExcerpt}
          >
            摘录
          </button>
          <span className="hint">
            <kbd>#</kbd> 行内标签 <span className="dot">·</span> <kbd>{modKey}</kbd>
            <kbd>E</kbd> 摘录
          </span>
        </div>
        <div className="bar-right">
          {!empty && <span className="count">{content.length}</span>}
          <button type="button" className={'send ' + status.state} disabled={empty || busy} onClick={send}>
            {status.state === 'sending' ? (
              <>
                <span className="spinner" /> 发送中
              </>
            ) : status.state === 'sent' ? (
              <>
                <IconCheck width={15} height={15} /> 已记录
              </>
            ) : (
              <>
                发送 <kbd className="on-accent">{modKey}</kbd>
                <kbd className="on-accent">↵</kbd>
              </>
            )}
          </button>
        </div>
      </footer>
    </div>
  )
}
