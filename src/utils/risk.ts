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
  webrtcExposure: 6,
  webrtcMismatch: 18
}

function levelFromScore(score: number): RiskLevel {
  if (score >= 45) return 'high'
  if (score >= 20) return 'mid'
  return 'low'
}

function extractLanguageRegion(languageTag: string): string {
  const parts = languageTag.split('-').map((part) => part.trim().toUpperCase())
  return parts.find((part, index) => index > 0 && (/^[A-Z]{2}$/.test(part) || /^\d{3}$/.test(part))) || ''
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

  const outletCountryCode = ip.countryCode?.toUpperCase() || ''

  // 5. 浏览器语言与 IP 地区是否一致
  const primaryLang = browser.systemLanguage || ''
  const primaryLangRegion = extractLanguageRegion(primaryLang)
  const browserLanguageRegions = Array.from(
    new Set(browser.browserLanguages.map(extractLanguageRegion).filter(Boolean))
  )
  const hasLanguageRegionMatch = !!(outletCountryCode && browserLanguageRegions.includes(outletCountryCode))
  const primaryLanguageMismatch = !!(
    primaryLangRegion &&
    outletCountryCode &&
    primaryLangRegion !== outletCountryCode
  )
  const browserLanguageListMismatch = !!(
    outletCountryCode &&
    browserLanguageRegions.length > 0 &&
    !hasLanguageRegionMatch
  )
  let languageMismatch = false
  let languageDetail = '浏览器语言未携带地区代码，无法直接比对，已跳过判断。'
  if (outletCountryCode && (primaryLangRegion || browserLanguageRegions.length > 0)) {
    languageMismatch = primaryLanguageMismatch || browserLanguageListMismatch
    const languageListLabel = browserLanguageRegions.length > 0 ? browserLanguageRegions.join('/') : '无地区码'
    languageDetail = languageMismatch
      ? `系统语言地区代码为 ${primaryLangRegion || '无地区码'}，浏览器语言列表地区代码为 ${languageListLabel}，未匹配 IP 归属国家（${outletCountryCode}）。`
      : `浏览器语言地区代码与 IP 归属国家存在匹配（IP: ${outletCountryCode}；系统: ${primaryLangRegion || '无地区码'}；列表: ${languageListLabel}）。`
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

  // 6. WebRTC 暴露额外 IP
  const webrtcExposure = browser.webrtcChecked && !!browser.webrtcLocalIp
  const webrtcIpCountryCode = browser.webrtcIpInfo?.countryCode?.toUpperCase() || ''
  const webrtcMismatch = !!(webrtcExposure && webrtcIpCountryCode && outletCountryCode && webrtcIpCountryCode !== outletCountryCode)

  if (webrtcExposure) {
    score += WEIGHTS.webrtcExposure
  }
  if (webrtcMismatch) {
    score += WEIGHTS.webrtcMismatch
  }
  factors.push({
    key: 'webrtcExposure',
    label: 'WebRTC 暴露额外 IP',
    level: 'low',
    triggered: webrtcExposure,
    detail: !browser.webrtcSupported
      ? '当前浏览器不支持 WebRTC 检测。'
      : webrtcExposure
      ? browser.webrtcIpInfo
        ? `检测到 WebRTC 候选地址中包含可识别 IP（${browser.webrtcLocalIp}），归属地为 ${browser.webrtcIpInfo.country || '未知'}（${browser.webrtcIpInfo.countryCode || '未知'}）。`
        : `检测到 WebRTC 候选地址中包含可识别 IP（${browser.webrtcLocalIp}），但归属地查询失败。`
      : '未通过 WebRTC 检测到额外暴露的 IP 地址。'
  })
  factors.push({
    key: 'webrtcMismatch',
    label: 'WebRTC IP 与出口 IP 国家不一致',
    level: 'mid',
    triggered: webrtcMismatch,
    detail: !webrtcExposure
      ? '未检测到 WebRTC 暴露 IP，已跳过一致性比对。'
      : webrtcIpCountryCode && outletCountryCode
      ? webrtcMismatch
        ? `WebRTC IP 国家（${webrtcIpCountryCode}）与出口 IP 国家（${outletCountryCode}）不一致。`
        : `WebRTC IP 国家与出口 IP 国家一致（均为 ${outletCountryCode}）。`
      : 'WebRTC IP 或出口 IP 的国家信息不完整，无法完成一致性比对。'
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
