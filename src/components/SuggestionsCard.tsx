import type { RiskResult } from '../types'

interface SuggestionsCardProps {
  risk: RiskResult | null
}

const BASE_SUGGESTIONS = [
  '为常用账号固定一个国家和出口 IP，尽量不要来回切换节点。',
  '优先选择 ISP 住宅 IP 或移动网络出口，而不是机房 / 数据中心 IP。',
  'Claude Chat（网页/App）与 Claude Code（命令行）尽量使用同一出口环境。',
  '新注册的账号建议先保持低频、正常节奏使用，避免刚注册就高强度调用。'
]

const FACTOR_SUGGESTIONS: Record<string, string> = {
  datacenter: '当前出口疑似数据中心 IP，建议更换为住宅或移动网络出口。',
  vpnProxy: '当前出口疑似共享 VPN / Proxy，建议使用更稳定、独享度更高的出口。',
  countrySwitching: '近期出口国家变化较多，建议固定在一个国家/地区，减少切换频率。',
  timezoneMismatch: '系统时区与 IP 所在国家不一致，建议保持设备时区与常用出口地区匹配。',
  languageMismatch: '浏览器语言地区与 IP 所在国家不一致，可考虑调整浏览器语言设置。',
  webrtcExposure: '检测到 WebRTC 可能暴露额外 IP 信息，可结合 WebRTC IP 地区判断是否需要调整浏览器设置。',
  webrtcMismatch: 'WebRTC IP 与出口 IP 国家不一致，建议排查代理、IPv6、WebRTC 或系统网络路由设置。'
}

export default function SuggestionsCard({ risk }: SuggestionsCardProps) {
  const dynamicTips = risk ? risk.factors.filter((f) => f.triggered).map((f) => FACTOR_SUGGESTIONS[f.key]) : []

  return (
    <section className="panel p-5 sm:p-6">
      <p className="eyebrow">优化建议</p>

      {dynamicTips.length > 0 && (
        <div className="mt-3 space-y-2">
          {dynamicTips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-signal-mid/25 bg-signal-mid/5 px-3 py-2.5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-mid" />
              <p className="text-[13px] leading-relaxed text-ink-primary">{tip}</p>
            </div>
          ))}
        </div>
      )}

      <ul className="mt-4 space-y-2.5">
        {BASE_SUGGESTIONS.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-secondary">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-muted" />
            {tip}
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-lg border border-base-border bg-base-surface2/50 p-3">
        <p className="text-[12px] leading-relaxed text-ink-muted">
          本工具仅基于公开信息与浏览器本地信号做环境稳定性提示，不代表任何平台的官方判定，
          也不能保证账号不会因其他原因受到限制。请遵守 Claude 及所在平台的服务条款，
          不要将本工具用于规避平台规则或风控机制。
        </p>
      </div>
    </section>
  )
}
