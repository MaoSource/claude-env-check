import type { FetchStage, IpInfo } from '../types'
import StatusBadge from './StatusBadge'

interface IpInfoCardProps {
  stage: FetchStage
  ip: IpInfo | null
  errorMessage: string | null
}

export default function IpInfoCard({ stage, ip, errorMessage }: IpInfoCardProps) {
  return (
    <section className="panel p-5 sm:p-6">
      <p className="eyebrow">IP 信息</p>

      {stage === 'loading' && (
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-base-surface2" />
          ))}
        </div>
      )}

      {stage === 'error' && (
        <div className="mt-4 rounded-lg border border-signal-high/25 bg-signal-high/5 p-3 text-sm text-signal-high">
          {errorMessage ?? 'IP 信息获取失败。'}
        </div>
      )}

      {stage === 'success' && ip && (
        <div className="mt-3">
          <div className="kv-row">
            <span className="kv-label">IP 地址</span>
            <span className="kv-value">{ip.ip || '—'}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">国家 / 地区</span>
            <span className="kv-value">
              {ip.country || '—'} {ip.countryCode ? `(${ip.countryCode})` : ''}
            </span>
          </div>
          <div className="kv-row">
            <span className="kv-label">城市</span>
            <span className="kv-value">{ip.city || '—'}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">ISP</span>
            <span className="kv-value">{ip.isp || '—'}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">ASN</span>
            <span className="kv-value">{ip.asn || '—'}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">疑似数据中心 IP</span>
            <StatusBadge ok={ip.suspectDatacenter} trueLabel="是" falseLabel="否" />
          </div>
          <div className="kv-row">
            <span className="kv-label">疑似 VPN / Proxy / Hosting</span>
            <StatusBadge ok={ip.suspectVpnProxy} trueLabel="是" falseLabel="否" />
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            数据来源：{ip.source}。数据中心 / VPN 判断基于 ISP 名称关键词的启发式匹配，仅供参考，不代表官方结论。
          </p>
        </div>
      )}
    </section>
  )
}
