import { useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { normalizeTag } from '../lib/compose'
import { IconClose, IconHash } from './Icons'

interface Props {
  tags: string[]
  onChange: (tags: string[]) => void
  suggestions: string[]
  placeholder?: string
  /** Called on ⌘/Ctrl+Enter so the composer can send from inside the tag field. */
  onSubmit?: () => void
}

const MAX_SUGGESTIONS = 6

export function TagInput({ tags, onChange, suggestions, placeholder = '添加标签', onSubmit }: Props) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const matches = useMemo(() => {
    const q = normalizeTag(query).toLowerCase()
    return suggestions
      .filter((t) => !tags.includes(t) && (!q || t.toLowerCase().includes(q)))
      .slice(0, MAX_SUGGESTIONS)
  }, [query, suggestions, tags])

  const add = (raw: string) => {
    const tag = normalizeTag(raw)
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setQuery('')
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      if (query.trim()) add(query)
      e.preventDefault()
      onSubmit?.()
      return
    }
    if (e.key === 'Enter' || e.key === ',' || e.key === '，' || (e.key === ' ' && query.trim())) {
      e.preventDefault()
      add(query || matches[0] || '')
    } else if (e.key === 'Tab' && (query || matches.length) && matches[0]) {
      e.preventDefault()
      add(matches[0])
    } else if (e.key === 'Backspace' && !query && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  return (
    <div className="tags" onClick={() => inputRef.current?.focus()}>
      <IconHash className="tags-icon" />
      {tags.map((t) => (
        <span key={t} className="chip">
          {t}
          <button
            type="button"
            className="chip-x"
            aria-label={`移除标签 ${t}`}
            onClick={(e) => {
              e.stopPropagation()
              onChange(tags.filter((x) => x !== t))
            }}
          >
            <IconClose width={12} height={12} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="tags-input"
        value={query}
        placeholder={tags.length ? '' : placeholder}
        onChange={(e) => setQuery(e.target.value.replace(/^#/, ''))}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false)
          if (query.trim()) add(query)
        }}
        spellCheck={false}
      />
      {focused && matches.length > 0 && (
        <span className="suggest">
          {matches.map((t, i) => (
            <button
              key={t}
              type="button"
              className={'chip ghost' + (i === 0 && query ? ' first' : '')}
              onMouseDown={(e) => {
                e.preventDefault()
                add(t)
              }}
            >
              {t}
            </button>
          ))}
        </span>
      )}
    </div>
  )
}
