import { useCallback, useEffect, useState } from 'react'
import type { BrowserInfo, FetchStage, IpInfo, RiskResult } from '../types'
import { resolveIpInfo } from '../utils/ipProviders'
import { detectWebrtcLeak } from '../utils/webrtc'
import { recordAndCountCountrySwitches } from '../utils/countryHistory'
import { evaluateRisk } from '../utils/risk'

function collectStaticBrowserInfo(): Omit<BrowserInfo, 'webrtcLocalIp' | 'webrtcChecked' | 'webrtcSupported'> {
  const tzOptions = Intl.DateTimeFormat().resolvedOptions()
  return {
    userAgent: navigator.userAgent,
    systemLanguage: navigator.language,
    browserLanguages: Array.from(navigator.languages || [navigator.language]),
    timezone: tzOptions.timeZone,
    timezoneOffsetMinutes: -new Date().getTimezoneOffset(),
    screenResolution: `${window.screen.width} × ${window.screen.height}`,
    devicePixelRatio: window.devicePixelRatio || 1
  }
}

export interface DetectionState {
  stage: FetchStage
  errorMessage: string | null
  ip: IpInfo | null
  browser: BrowserInfo | null
  risk: RiskResult | null
  distinctCountriesRecently: number
  refresh: () => void
}

export function useEnvironmentDetection(): DetectionState {
  const [stage, setStage] = useState<FetchStage>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [ip, setIp] = useState<IpInfo | null>(null)
  const [browser, setBrowser] = useState<BrowserInfo | null>(null)
  const [risk, setRisk] = useState<RiskResult | null>(null)
  const [distinctCountriesRecently, setDistinctCountriesRecently] = useState(1)
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    let cancelled = false

    async function run() {
      setStage('loading')
      setErrorMessage(null)

      const staticBrowser = collectStaticBrowserInfo()

      const [ipResult, webrtcResult] = await Promise.allSettled([
        resolveIpInfo(),
        detectWebrtcLeak()
      ])

      if (cancelled) return

      if (ipResult.status === 'rejected') {
        setStage('error')
        setErrorMessage('IP 信息查询失败：所有数据源均无响应，请检查网络后重试。')
        // 浏览器信息不依赖 IP，依然展示
        const fallbackBrowser: BrowserInfo = {
          ...staticBrowser,
          webrtcChecked: webrtcResult.status === 'fulfilled',
          webrtcSupported: webrtcResult.status === 'fulfilled' ? webrtcResult.value.supported : false,
          webrtcLocalIp: webrtcResult.status === 'fulfilled' ? webrtcResult.value.localIp : null
        }
        setBrowser(fallbackBrowser)
        return
      }

      const ipInfo = ipResult.value
      const browserInfo: BrowserInfo = {
        ...staticBrowser,
        webrtcChecked: webrtcResult.status === 'fulfilled',
        webrtcSupported: webrtcResult.status === 'fulfilled' ? webrtcResult.value.supported : false,
        webrtcLocalIp: webrtcResult.status === 'fulfilled' ? webrtcResult.value.localIp : null
      }

      const countryCount = recordAndCountCountrySwitches(ipInfo.countryCode)

      const riskResult = evaluateRisk({
        ip: ipInfo,
        browser: browserInfo,
        distinctCountriesRecently: countryCount
      })

      setIp(ipInfo)
      setBrowser(browserInfo)
      setDistinctCountriesRecently(countryCount)
      setRisk(riskResult)
      setStage('success')
    }

    run()

    return () => {
      cancelled = true
    }
  }, [tick])

  return { stage, errorMessage, ip, browser, risk, distinctCountriesRecently, refresh }
}
