# Claude 使用环境检测（Environment Probe）

纯前端的网络 / 浏览器环境稳定性检测工具：查询出口 IP 信息、读取浏览器环境信号、
做一致性交叉比对，输出风险评分与优化建议。

> ⚠️ 说明：本工具只做**环境信号检测与提示**，结果基于公开 IP 库与浏览器 API 的启发式判断，
> **不代表任何平台的官方结论，也不保证账号不会因其他原因受限**。请遵守 Claude 及所在平台的服务条款，
> 不要将本工具用于规避平台风控规则。

## 功能

- **IP 信息**：IP 地址、国家/地区、城市、ISP/ASN、疑似数据中心 IP、疑似 VPN/Proxy/Hosting
- **浏览器环境**：User-Agent、系统/浏览器语言、时区、屏幕分辨率、WebRTC 本地 IP 泄露检测、时区与 IP 地区一致性
- **风险评分**：0-100 分，低/中/高三档，逐项列出命中的风险因子及原因
- **优化建议**：根据命中的风险因子动态给出针对性建议，并附通用建议

## 技术栈

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3

## 数据来源与容错

IP 信息依次尝试以下三个公开 API（均为免费/匿名可用额度），一个失败自动切换下一个：

1. `https://ipwho.is/`
2. `https://ipapi.co/json/`
3. `https://ipinfo.io/json`

数据中心 / VPN / 代理的判断基于 ISP、ASN 文本的关键词启发式匹配，**不是精确的商业级检测**，
仅作为参考信号之一。

WebRTC 检测通过创建 `RTCPeerConnection` 并收集 ICE candidate 完成，全部在浏览器本地执行，
不会向任何服务器上传结果。

国家变化历史仅保存在浏览器 `localStorage` 中（近 7 天窗口），不上传、不跨设备同步，
可在浏览器开发者工具中清除 `env-check.country-history.v1` 这个 key 来重置。

## 本地运行

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 按提示打开浏览器访问，例如 http://localhost:5173
```

## 构建生产版本

```bash
npm run build
npm run preview   # 本地预览构建产物
```

构建产物在 `dist/` 目录，是纯静态文件，可以直接部署到 Vercel / Netlify / Cloudflare Pages /
任意静态托管服务，无需后端。

## 目录结构

```
src/
├── components/        # UI 组件（卡片、徽标等）
│   ├── Header.tsx
│   ├── OverviewCard.tsx
│   ├── IpInfoCard.tsx
│   ├── BrowserInfoCard.tsx
│   ├── RiskScoreCard.tsx
│   ├── SuggestionsCard.tsx
│   └── StatusBadge.tsx
├── hooks/
│   └── useEnvironmentDetection.ts   # 组合 IP / 浏览器 / 风险评分的检测流程
├── utils/
│   ├── ipProviders.ts        # 多数据源 IP 查询 + 归一化 + 关键词启发式判断
│   ├── webrtc.ts             # WebRTC 本地 IP 泄露检测
│   ├── countryHistory.ts     # 基于 localStorage 的国家切换历史记录
│   ├── timezoneCountryMap.ts # 时区 -> 常见国家 映射表
│   └── risk.ts                # 风险评分核心逻辑
├── types.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 关于风险评分的说明

评分因子与权重（满分 100，达到 45 分为高风险，20 分为中风险）：

| 因子 | 权重 | 说明 |
| --- | --- | --- |
| 疑似数据中心 IP | 35 | ISP/ASN 命中数据中心关键词 |
| 疑似 VPN/Proxy/Hosting | 35 | ISP/ASN 命中 VPN/代理关键词 |
| 近 7 天出口国家频繁变化 | 25（2 个国家减半） | 基于本地历史记录 |
| 时区与 IP 国家不一致 | 18 | 基于时区-国家映射表 |
| WebRTC 泄露 IP | 18 | ICE candidate 中出现可识别 IP |
| 浏览器语言与 IP 地区不一致 | 10 | 语言标签地区码 vs IP 国家码 |

可以在 `src/utils/risk.ts` 中调整权重、阈值，或在 `src/utils/ipProviders.ts` 中扩充
数据中心 / VPN 关键词列表。
