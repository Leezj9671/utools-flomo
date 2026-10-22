import { utools } from '../lib/platform'
import { ApiField } from './ApiField'
import { IconExternal, IconShield, Mark } from './Icons'

export const FLOMO_API_PAGE = 'https://v.flomoapp.com/mine?source=incoming_webhook'

interface Props {
  candidate: string
  hasPending: boolean
  onConnected: (url: string) => void
}

export function Onboarding({ candidate, hasPending, onConnected }: Props) {
  return (
    <div className="onboarding">
      <header className="ob-head">
        <Mark size={28} />
        <div>
          <h1>连接你的 flomo</h1>
          <p>只需一次。之后在 uTools 里写下的想法，按 ⌘/Ctrl + ↵ 就能记进 flomo。</p>
        </div>
      </header>

      <ol className="steps">
        <li>
          <span className="step-n">1</span>
          <div className="step-body">
            <div className="step-title">复制你的专属 API 地址</div>
            <div className="step-desc">在 flomo「设置 → API」页面，复制以 https://flomoapp.com/iwh/ 开头的链接（需 PRO 会员）。</div>
          </div>
          <button type="button" className="btn ghost" onClick={() => utools.shellOpenExternal(FLOMO_API_PAGE)}>
            打开 flomo <IconExternal width={13} height={13} />
          </button>
        </li>
        <li>
          <span className="step-n">2</span>
          <div className="step-body">
            <div className="step-title">粘贴到这里并验证</div>
            <ApiField initial={candidate} autoFocus submitLabel="验证并连接" onVerified={onConnected} />
          </div>
        </li>
      </ol>

      {hasPending && <p className="pending">你刚才输入的内容已暂存，连接后会自动回填。</p>}

      <footer className="ob-foot">
        <IconShield width={14} height={14} />
        <span>
          地址只保存在这台设备上；笔记直接发往 flomoapp.com，不经过任何其他服务器。
          <br />
          小技巧：把 API 地址直接粘贴到 uTools 搜索框，选择「设为 flomo API」即可。
        </span>
      </footer>
    </div>
  )
}
