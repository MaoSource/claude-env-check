import Header from './components/Header'
import OverviewCard from './components/OverviewCard'
import IpInfoCard from './components/IpInfoCard'
import BrowserInfoCard from './components/BrowserInfoCard'
import RiskScoreCard from './components/RiskScoreCard'
import SuggestionsCard from './components/SuggestionsCard'
import { useEnvironmentDetection } from './hooks/useEnvironmentDetection'

export default function App() {
  const { stage, errorMessage, ip, browser, risk, refresh } = useEnvironmentDetection()

  return (
    <div className="min-h-screen bg-base-bg pb-16 pt-8 sm:pt-12">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
        <Header />

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          <OverviewCard stage={stage} ip={ip} risk={risk} onRefresh={refresh} />

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <IpInfoCard stage={stage} ip={ip} errorMessage={errorMessage} />
            <BrowserInfoCard stage={stage} browser={browser} ip={ip} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
            <RiskScoreCard stage={stage} risk={risk} />
            <SuggestionsCard risk={risk} />
          </div>
        </div>

        <footer className="mt-8 text-center text-[12px] text-ink-muted">
          所有检测均在你的浏览器本地完成，不会上传或存储到任何服务器。
        </footer>
      </div>
    </div>
  )
}
