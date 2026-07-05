// 统一后的 IP 信息结构（不同 API 字段各异，这里做归一化）
export interface IpInfo {
  ip: string
  country: string // 国家中文/英文名
  countryCode: string // ISO 国家代码，如 CN / US / TW
  city: string
  region: string
  isp: string // ISP / Org 名称
  asn: string
  source: string // 数据来源 API 名称
  suspectDatacenter: boolean
  suspectVpnProxy: boolean
}

export interface BrowserInfo {
  userAgent: string
  systemLanguage: string // navigator.language
  browserLanguages: string[] // navigator.languages
  timezone: string // Intl 时区
  timezoneOffsetMinutes: number
  screenResolution: string
  devicePixelRatio: number
  webrtcLocalIp: string | null
  webrtcChecked: boolean
  webrtcSupported: boolean
}

export type RiskLevel = 'low' | 'mid' | 'high'

export interface RiskFactor {
  key: string
  label: string
  level: RiskLevel
  triggered: boolean
  detail: string
}

export interface RiskResult {
  score: number // 0-100
  level: RiskLevel
  factors: RiskFactor[]
}

export type FetchStage = 'idle' | 'loading' | 'success' | 'error'
