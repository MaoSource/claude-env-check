import type { BrowserInfo, IpInfo, RiskFactor, RiskLevel, RiskResult } from '../types'
import { timezoneImpliesCountry } from './timezoneCountryMap'

interface ScoreEvalInput {
  ip: IpInfo
  browser: BrowserInfo
  distinctCountriesRecently: number
}

// 每个风险因子的权重，与需求中的「高/中/低」对应
const WEIGHTS = {
  datacenter: 35,
  vpnProxy: 35,
  countrySwitching: 25,
  timezoneMismatch: 18,
  languageMismatch: 10,
  webrtcLeak: 18
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 45) return 'high'
  if (score >= 20) return 'mid'
  return 'low'
}

export function evaluateRisk({ ip, browser, distinctCountriesRecently }: ScoreEvalInput): RiskResult {
  const factors: RiskFactor[] = []
  let score = 0

  // 1. 数据中心 IP
  if (ip.suspectDatacenter) {
    score += WEIGHTS.datacenter
  }
  factors.push({
    key: 'datacenter',
    label: '疑似数据中心 IP',
    level: 'high',
    triggered: ip.suspectDatacenter,
    detail: ip.suspectDatacenter
      ? `ISP/ASN 信息（${ip.isp} / ${ip.asn}）匹配到数据中心特征关键词。`
      : '未在 ISP/ASN 信息中匹配到数据中心特征关键词。'
  })

  // 2. VPN / Proxy / 共享代理
  if (ip.suspectVpnProxy) {
    score += WEIGHTS.vpnProxy
  }
  factors.push({
    key: 'vpnProxy',
    label: '疑似 VPN / Proxy / 共享代理',
    level: 'high',
    triggered: ip.suspectVpnProxy,
    detail: ip.suspectVpnProxy
      ? `ISP/ASN 信息中出现常见 VPN / 代理服务关键词。`
      : '未匹配到常见 VPN / 代理服务关键词（无法覆盖所有服务商，仅供参考）。'
  })

  // 3. 国家频繁变化（基于本机浏览器最近 7 天的本地记录）
  const countrySwitchTriggered = distinctCountriesRecently >= 3
  if (countrySwitchTriggered) {
    score += WEIGHTS.countrySwitching
  } else if (distinctCountriesRecently === 2) {
    score += Math.round(WEIGHTS.countrySwitching / 2)
  }
  factors.push({
    key: 'countrySwitching',
    label: '近 7 天出口国家频繁变化',
    level: 'high',
    triggered: countrySwitchTriggered,
    detail:
      distinctCountriesRecently <= 1
        ? '本机近 7 天检测记录中出口国家保持一致。'
        : `本机近 7 天检测记录中出现过 ${distinctCountriesRecently} 个不同的出口国家（数据仅保存在本地浏览器）。`
  })

  // 4. 时区与 IP 国家是否一致
  const impliedCountries = timezoneImpliesCountry(browser.timezone)
  let timezoneMismatch = false
  let timezoneDetail = '未收录该时区对应的国家映射，无法判断一致性。'
  if (impliedCountries && ip.countryCode) {
    timezoneMismatch = !impliedCountries.includes(ip.countryCode.toUpperCase())
    timezoneDetail = timezoneMismatch
      ? `浏览器时区（${browser.timezone}）通常对应 ${impliedCountries.join('/')}，与 IP 归属国家（${ip.countryCode}）不一致。`
      : `浏览器时区（${browser.timezone}）与 IP 归属国家（${ip.countryCode}）大致一致。`
  }
  if (timezoneMismatch) {
    score += WEIGHTS.timezoneMismatch
  }
  factors.push({
    key: 'timezoneMismatch',
    label: '时区与 IP 国家不一致',
    level: 'mid',
    triggered: timezoneMismatch,
    detail: timezoneDetail
  })

  // 5. 浏览器语言与 IP 地区是否一致
  const primaryLang = browser.systemLanguage || ''
  const langRegion = primaryLang.includes('-') ? primaryLang.split('-')[1]?.toUpperCase() : ''
  let languageMismatch = false
  let languageDetail = '浏览器语言未携带地区代码，无法直接比对，已跳过判断。'
  if (langRegion && ip.countryCode) {
    languageMismatch = langRegion !== ip.countryCode.toUpperCase()
    languageDetail = languageMismatch
      ? `浏览器语言地区代码为 ${langRegion}，与 IP 归属国家（${ip.countryCode}）不一致。`
      : `浏览器语言地区代码与 IP 归属国家一致（均为 ${ip.countryCode}）。`
  }
  if (languageMismatch) {
    score += WEIGHTS.languageMismatch
  }
  factors.push({
    key: 'languageMismatch',
    label: '浏览器语言与 IP 地区不一致',
    level: 'low',
    triggered: languageMismatch,
    detail: languageDetail
  })

  // 6. WebRTC 本地 IP 泄露
  const webrtcLeak = browser.webrtcChecked && !!browser.webrtcLocalIp
  if (webrtcLeak) {
    score += WEIGHTS.webrtcLeak
  }
  factors.push({
    key: 'webrtcLeak',
    label: 'WebRTC 泄露本地/真实 IP',
    level: 'mid',
    triggered: webrtcLeak,
    detail: !browser.webrtcSupported
      ? '当前浏览器不支持 WebRTC 检测。'
      : webrtcLeak
      ? `检测到 WebRTC 候选地址中包含可识别 IP（${browser.webrtcLocalIp}）。`
      : '未通过 WebRTC 检测到额外暴露的 IP 地址。'
  })

  const clampedScore = Math.min(100, score)

  return {
    score: clampedScore,
    level: levelFromScore(clampedScore),
    factors
  }
}

export const RISK_LEVEL_META: Record<RiskLevel, { label: string; color: string; badge: string }> = {
  low: { label: '低风险', color: 'text-signal-low', badge: 'bg-signal-low/15 text-signal-low border-signal-low/30' },
  mid: { label: '中风险', color: 'text-signal-mid', badge: 'bg-signal-mid/15 text-signal-mid border-signal-mid/30' },
  high: { label: '高风险', color: 'text-signal-high', badge: 'bg-signal-high/15 text-signal-high border-signal-high/30' }
}
