// Turns the editor state into the text flomo receives.

// flomo tags: `#` followed by non-space characters; `/` nests (#读书/摘录).
const TAG_IN_TEXT = /(?:^|\s)#([^\s#]+)/g

export function normalizeTag(raw: string): string {
  return raw.trim().replace(/^#+/, '').replace(/\s+/g, '').replace(/\/+$/, '')
}

export function tagsInText(text: string): string[] {
  return [...text.matchAll(TAG_IN_TEXT)].map((m) => m[1])
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export interface ComposeInput {
  text: string
  quote: string
  source: string
  tags: string[]
  markdown: boolean
}

export function composeMemo({ text, quote, source, tags, markdown }: ComposeInput): string {
  const blocks: string[] = []
  // flomo's markdown drops `>` blockquotes (verified against the live API), so corner
  // brackets mark the excerpt in both modes.
  const q = quote.trim()
  if (q) blocks.push(`「${q}」`)
  const body = text.trim()
  if (body) blocks.push(body)
  if (source) blocks.push(markdown ? `[${hostOf(source)}](${source})` : source)

  const inline = new Set(tagsInText(body))
  const extra = tags.filter((t) => !inline.has(t))
  if (extra.length) blocks.push(extra.map((t) => `#${t}`).join(' '))

  return blocks.join('\n\n')
}

export { hostOf }
