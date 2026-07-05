import type { IpInfo } from '../types'

const DATACENTER_KEYWORDS = [
  'amazon', 'aws', 'google cloud', 'google llc', 'microsoft', 'azure',
  'digitalocean', 'digital ocean', 'linode', 'akamai', 'vultr', 'ovh',
  'hetzner', 'oracle cloud', 'alibaba', 'tencent', 'choopa', 'leaseweb',
  'contabo', 'scaleway', 'upcloud', 'hosting', 'datacenter', 'data center',
  'colo', 'server', 'cloud computing', 'cdn', 'fly.io', 'render.com'
]

const VPN_PROXY_KEYWORDS = [
  'vpn', 'proxy', 'nordvpn', 'expressvpn', 'surfshark', 'private internet access',
  'mullvad', 'protonvpn', 'tor exit', 'anonymizer', 'anonymous', 'psiphon',
  'shadowsocks', 'ipvanish', 'windscribe', 'cyberghost', 'hola'
]

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase()
  return keywords.some((k) => lower.includes(k))
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

// --- 三个数据源的归一化适配器 ---

async function fromIpwhoIs(): Promise<IpInfo> {
  const res = await fetchWithTimeout('https://ipwho.is/', 6000)
  if (!res.ok) throw new Error('ipwho.is 请求失败')
  const d = await res.json()
  if (d?.success === false) throw new Error('ipwho.is 返回失败')

  const org = d?.connection?.isp || d?.connection?.org || ''
  const asn = d?.connection?.asn ? `AS${d.connection.asn}` : ''
  const combinedText = `${org} ${asn}`

  return {
    ip: d.ip ?? '',
    country: d.country ?? '',
    countryCode: d.country_code ?? '',
    city: d.city ?? '',
    region: d.region ?? '',
    isp: org || '未知',
    asn: asn || '未知',
    source: 'ipwho.is',
    suspectDatacenter: matchKeywords(combinedText, DATACENTER_KEYWORDS),
    suspectVpnProxy: matchKeywords(combinedText, VPN_PROXY_KEYWORDS)
  }
}

async function fromIpapiCo(): Promise<IpInfo> {
  const res = await fetchWithTimeout('https://ipapi.co/json/', 6000)
  if (!res.ok) throw new Error('ipapi.co 请求失败')
  const d = await res.json()
  if (d?.error) throw new Error(d?.reason || 'ipapi.co 返回失败')

  const org = d?.org || ''
  const asn = d?.asn || ''
  const combinedText = `${org} ${asn}`

  return {
    ip: d.ip ?? '',
    country: d.country_name ?? '',
    countryCode: d.country ?? d.country_code ?? '',
    city: d.city ?? '',
    region: d.region ?? '',
    isp: org || '未知',
    asn: asn || '未知',
    source: 'ipapi.co',
    suspectDatacenter: matchKeywords(combinedText, DATACENTER_KEYWORDS),
    suspectVpnProxy: matchKeywords(combinedText, VPN_PROXY_KEYWORDS)
  }
}

async function fromIpinfoIo(): Promise<IpInfo> {
  const res = await fetchWithTimeout('https://ipinfo.io/json', 6000)
  if (!res.ok) throw new Error('ipinfo.io 请求失败')
  const d = await res.json()

  const org = d?.org || ''
  const combinedText = `${org}`

  return {
    ip: d.ip ?? '',
    country: d.country ?? '',
    countryCode: d.country ?? '',
    city: d.city ?? '',
    region: d.region ?? '',
    isp: org || '未知',
    asn: (org.match(/^AS\d+/) || [''])[0] || '未知',
    source: 'ipinfo.io',
    suspectDatacenter: matchKeywords(combinedText, DATACENTER_KEYWORDS),
    suspectVpnProxy: matchKeywords(combinedText, VPN_PROXY_KEYWORDS)
  }
}

// 依次尝试三个来源，全部失败则抛出错误，由上层 UI 呈现兜底文案
export async function resolveIpInfo(): Promise<IpInfo> {
  const providers = [fromIpwhoIs, fromIpapiCo, fromIpinfoIo]
  let lastError: unknown = null

  for (const provider of providers) {
    try {
      return await provider()
    } catch (err) {
      lastError = err
    }
  }

  throw lastError instanceof Error ? lastError : new Error('所有 IP 查询来源均不可用')
}
