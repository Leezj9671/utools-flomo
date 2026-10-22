import { useState } from 'react'
import { utools } from '../lib/platform'
import type { Settings } from '../lib/store'
import { ApiField } from './ApiField'
import { IconBack, IconExternal, IconShield } from './Icons'
import { FLOMO_API_PAGE } from './Onboarding'
import { TagInput } from './TagInput'
import { Toggle } from './Toggle'

interface Props {
  api: string
  candidate: string
  settings: Settings
  recentTags: string[]
  onChange: (settings: Settings) => void
  onApiChange: (url: string) => void
  onBack: () => void
}

function maskApi(url: string) {
  const m = url.match(/^(https:\/\/flomoapp\.com\/iwh\/)([^/]+)\/([^/]+)\/?$/)
  if (!m) return url
  return `${m[1]}${m[2]}/${m[3].slice(0, 4)}••••••••${m[3].slice(-4)}/`
}

export function SettingsView({ api, candidate, settings, recentTags, onChange, onApiChange, onBack }: Props) {
  const [editingApi, setEditingApi] = useState(Boolean(candidate))
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  return (
    <div className="settings" onKeyDown={(e) => e.key === 'Escape' && editingApi && setEditingApi(false)}>
      <header className="settings-head">
        <button type="button" className="icon-btn" aria-label="返回" onClick={onBack}>
          <IconBack />
        </button>
        <h1>设置</h1>
      </header>

      <section>
        <h2>flomo API</h2>
        {editingApi ? (
          <ApiField
            initial={candidate}
            autoFocus
            submitLabel="验证并保存"
            onVerified={(url) => {
              onApiChange(url)
              setEditingApi(false)
            }}
          />
        ) : (
          <div className="row">
            <span className="row-text">
              <span className="row-label mono api-masked">
                <span className="status-dot" /> {maskApi(api)}
              </span>
            </span>
            <span className="row-actions">
              <button type="button" className="btn ghost" onClick={() => utools.shellOpenExternal(FLOMO_API_PAGE)}>
                flomo <IconExternal width={13} height={13} />
              </button>
              <button type="button" className="btn ghost" onClick={() => setEditingApi(true)}>
                更换
              </button>
            </span>
          </div>
        )}
      </section>

      <section>
        <h2>默认标签</h2>
        <p className="section-desc">每条新笔记都会预先带上这些标签，发送前可以逐条去掉。</p>
        <TagInput
          tags={settings.defaultTags}
          onChange={(tags) => set('defaultTags', tags)}
          suggestions={recentTags}
          placeholder="例如：灵感、读书/摘录"
        />
      </section>

      <section>
        <h2>发送</h2>
        <Toggle
          label="Markdown 格式"
          hint="支持加粗、链接等语法；也可以在编辑界面按条切换"
          checked={settings.markdown}
          onChange={(v) => set('markdown', v)}
        />
        <Toggle
          label="摘录时附上来源链接"
          hint="在浏览器里选中文字并开启「摘录」时，自动带上当前网页地址"
          checked={settings.withSource}
          onChange={(v) => set('withSource', v)}
        />
        <Toggle
          label="发送后自动收起"
          hint="关闭后会留在编辑界面，方便连续记录"
          checked={settings.autoHide}
          onChange={(v) => set('autoHide', v)}
        />
      </section>

      <section>
        <h2>隐私</h2>
        <Toggle
          label="在多台设备间同步 API 地址"
          hint="开启后通过你的 uTools 账号同步；关闭时地址只存在这台设备"
          checked={settings.syncApi}
          onChange={(v) => set('syncApi', v)}
        />
        <p className="privacy">
          <IconShield width={14} height={14} />
          插件只会向你的 flomo API 地址发起请求，没有统计、没有中转服务器。
        </p>
      </section>
    </div>
  )
}
