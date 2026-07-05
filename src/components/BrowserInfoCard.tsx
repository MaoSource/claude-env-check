import type { BrowserInfo, FetchStage, IpInfo } from '../types'
import StatusBadge from './StatusBadge'
import { timezoneImpliesCountry } from '../utils/timezoneCountryMap'

interface BrowserInfoCardProps {
  stage: FetchStage
  browser: BrowserInfo | null
  ip: IpInfo | null
}

export default function BrowserInfoCard({ stage, browser, ip }: BrowserInfoCardProps) {
  if (stage === 'loading' || !browser) {
    return (
      <section className="panel p-5 sm:p-6">
        <p className="eyebrow">浏览器环境</p>
        <div className="mt-4 space-y-2.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 animate-pulse rounded bg-base-surface2" />
          ))}
        </div>
      </section>
    )
  }

  const implied = timezoneImpliesCountry(browser.timezone)
  let regionNote = '无法判断（未收录该时区）'
  if (implied && ip?.countryCode) {
    regionNote = implied.includes(ip.countryCode.toUpperCase())
      ? '时区与 IP 国家大致一致'
      : `时区通常对应 ${implied.join('/')}，与 IP 国家不一致`
  }

  const webrtcCountryCode = browser.webrtcIpInfo?.countryCode?.toUpperCase() || ''
  const outletCountryCode = ip?.countryCode?.toUpperCase() || ''
  const hasWebrtcMismatch = !!(browser.webrtcLocalIp && webrtcCountryCode && outletCountryCode && webrtcCountryCode !== outletCountryCode)
  const canCompareWebrtcCountry = !!(browser.webrtcLocalIp && webrtcCountryCode && outletCountryCode)

  return (
    <section className="panel p-5 sm:p-6">
      <p className="eyebrow">浏览器环境</p>
      <div className="mt-3">
        <div className="kv-row">
          <span className="kv-label">User-Agent</span>
          <span className="kv-value">{browser.userAgent}</span>
        </div>
        <div className="kv-row">
          <span className="kv-label">系统 / 浏览器语言</span>
          <span className="kv-value">{browser.systemLanguage}</span>
        </div>
        <div className="kv-row">
          <span className="kv-label">浏览器语言列表</span>
          <span className="kv-value">{browser.browserLanguages.join(', ')}</span>
        </div>
        <div className="kv-row">
          <span className="kv-label">时区</span>
          <span className="kv-value">
            {browser.timezone} (UTC{browser.timezoneOffsetMinutes >= 0 ? '+' : ''}
            {browser.timezoneOffsetMinutes / 60})
          </span>
        </div>
        <div className="kv-row">
          <span className="kv-label">屏幕分辨率</span>
          <span className="kv-value">
            {browser.screenResolution} · DPR {browser.devicePixelRatio}
          </span>
        </div>
        <div className="kv-row">
          <span className="kv-label">WebRTC 本地 IP 泄露</span>
          {browser.webrtcSupported ? browser.webrtcLocalIp ? (
            <span className="kv-value">{browser.webrtcLocalIp}</span>
          ) : (
            <StatusBadge ok={false} trueLabel="是" falseLabel="否" />
          ) : (
            <span className="kv-value text-ink-muted">不支持检测</span>
          )}
        </div>
        {browser.webrtcLocalIp && (
          <>
            <div className="kv-row">
              <span className="kv-label">WebRTC IP 地区</span>
              <span className="kv-value">
                {browser.webrtcIpInfo
                  ? `${browser.webrtcIpInfo.country || '未知'} ${browser.webrtcIpInfo.countryCode ? `(${browser.webrtcIpInfo.countryCode})` : ''}`
                  : browser.webrtcIpLookupError || '查询中断'}
              </span>
            </div>
            <div className="kv-row">
              <span className="kv-label">WebRTC / 出口 IP 一致性</span>
              {canCompareWebrtcCountry ? (
                <StatusBadge
                  ok={hasWebrtcMismatch}
                  trueLabel={`不一致（WebRTC ${webrtcCountryCode} / 出口 ${outletCountryCode}）`}
                  falseLabel={`一致（${outletCountryCode}）`}
                />
              ) : (
                <span className="kv-value text-ink-muted">国家信息不足，无法比对</span>
              )}
            </div>
          </>
        )}
        <div className="kv-row">
          <span className="kv-label">时区 / IP 地区一致性</span>
          <span className="kv-value">{regionNote}</span>
        </div>
      </div>
    </section>
  )
}
