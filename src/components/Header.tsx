export default function Header() {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-signal-cyan" />
        <span className="eyebrow">Connection Environment Probe</span>
      </div>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink-primary sm:text-3xl">
        使用环境检测
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-secondary">
        检测当前网络出口与浏览器环境的一致性信号，输出风险评分与优化建议。
        全部检测在本地浏览器完成，不会代为登录或操作任何账号。
      </p>
    </header>
  )
}
