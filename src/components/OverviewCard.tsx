import type { FetchStage, IpInfo, RiskResult } from '../types'
import { RISK_LEVEL_META } from '../utils/risk'

interface OverviewCardProps {
  stage: FetchStage
  ip: IpInfo | null
  risk: RiskResult | null
  onRefresh: () => void
}

export default function OverviewCard({ stage, ip, risk, onRefresh }: OverviewCardProps) {
  const isLoading = stage === 'loading'

  return (
    <section className="panel panel-scan overflow-hidden p-5 sm:p-6">
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">环境概览</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-mono text-xl font-medium text-ink-primary sm:text-2xl">
              {isLoading ? '检测中…' : ip ? ip.ip : '未知 IP'}
            </span>
            {ip && (
              <span className="text-sm text-ink-secondary">
                {ip.city ? `${ip.city} · ` : ''}
                {ip.country || '未知地区'}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {risk && (
            <span
              className={`rounded-full border px-3 py-1.5 text-sm font-medium ${RISK_LEVEL_META[risk.level].badge}`}
            >
              {RISK_LEVEL_META[risk.level].label} · {risk.score} 分
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="rounded-full border border-base-borderLight bg-base-surface2 px-3.5 py-1.5 text-sm text-ink-secondary transition hover:border-signal-cyan/40 hover:text-ink-primary disabled:opacity-50"
          >
            {isLoading ? '检测中…' : '重新检测'}
          </button>
        </div>
      </div>
    </section>
  )
}
