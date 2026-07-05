import type { FetchStage, RiskResult } from '../types'
import { RISK_LEVEL_META } from '../utils/risk'

interface RiskScoreCardProps {
  stage: FetchStage
  risk: RiskResult | null
}

const LEVEL_STROKE: Record<string, string> = {
  low: '#3DD68C',
  mid: '#F0A63B',
  high: '#F0555F'
}

function factorTone(factor: RiskResult['factors'][number]) {
  if (!factor.triggered) {
    return {
      row: 'border-base-border bg-base-surface2/40',
      badge: 'bg-signal-low/10 text-signal-low',
      label: '正常'
    }
  }

  if (factor.level === 'low') {
    return {
      row: 'border-signal-mid/20 bg-signal-mid/5',
      badge: 'bg-signal-mid/15 text-signal-mid',
      label: '提示'
    }
  }

  return {
    row: 'border-signal-high/20 bg-signal-high/5',
    badge: 'bg-signal-high/15 text-signal-high',
    label: '命中'
  }
}

function Gauge({ score, level }: { score: number; level: 'low' | 'mid' | 'high' }) {
  const radius = 54
  const circumference = Math.PI * radius // 半圆周长
  const progress = Math.min(1, score / 100)
  const dashOffset = circumference * (1 - progress)
  const stroke = LEVEL_STROKE[level]

  return (
    <svg viewBox="0 0 140 80" className="w-full max-w-[220px]">
      <path
        d="M 13 74 A 54 54 0 0 1 127 74"
        fill="none"
        stroke="#232A37"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        d="M 13 74 A 54 54 0 0 1 127 74"
        fill="none"
        stroke={stroke}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 700ms ease, stroke 300ms ease' }}
      />
      <text x="70" y="62" textAnchor="middle" className="font-mono" fill="#E7EAF0" fontSize="26" fontWeight={600}>
        {score}
      </text>
      <text x="70" y="76" textAnchor="middle" fill="#5C6577" fontSize="9" letterSpacing="1">
        RISK SCORE / 100
      </text>
    </svg>
  )
}

export default function RiskScoreCard({ stage, risk }: RiskScoreCardProps) {
  if (stage === 'loading' || !risk) {
    return (
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">风险评分</p>
        <div className="mt-6 flex justify-center">
          <div className="h-20 w-48 animate-pulse rounded-t-full bg-base-surface2" />
        </div>
      </section>
    )
  }

  const meta = RISK_LEVEL_META[risk.level]

  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="eyebrow">风险评分</p>
        <span className={`rounded-full border px-2.5 py-1 text-[12px] font-medium ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-2 flex justify-center">
        <Gauge score={risk.score} level={risk.level} />
      </div>

      <div className="mt-4 space-y-2">
        {risk.factors.map((factor) => {
          const tone = factorTone(factor)

          return (
            <div
              key={factor.key}
              className={`flex flex-col items-start gap-2 rounded-lg border px-3 py-2.5 text-[13px] sm:flex-row sm:justify-between sm:gap-3 ${tone.row}`}
            >
              <div className="min-w-0">
                <p className={factor.triggered ? 'font-medium text-ink-primary' : 'text-ink-secondary'}>
                  {factor.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">{factor.detail}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-mono ${tone.badge}`}>
                {tone.label}
              </span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
