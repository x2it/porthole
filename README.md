# Porthole

本地 Web UI 应用中枢 — 发现、识别、管理本机所有 Web 服务。

## 特性

- **智能扫描**: 合并系统所有监听端口 + 常见 Web UI 端口白名单,不再遗漏自定义端口服务
- **自动命名**: 未命中指纹库时,按 HTML `<title>` → 进程名 → Server 响应头自动获取有意义的名称,不再显示 `127.0.0.1:port`
- **自动归类**: 未识别应用根据进程名/服务器特征自动推断分类(AIDev/Proxy/DB 等),不再全归 UNKNOWN
- **指纹引擎**: 12+ 预设指纹(Ollama/LM Studio/ComfyUI/Jupyter/Open WebUI 等),数据驱动,新增只需 push 一个对象
- **Web UI 过滤**: 只保留返回 HTTP 响应的服务,过滤掉系统内部端口(DLL/IPC/数据库等)
- **极简极客 UI**: 深色扁平风格,等宽字体,快捷键 `R` 触发扫描

## 技术栈

- Electron 31 + electron-vite + electron-builder
- React 18 + TypeScript + Tailwind CSS 3
- Node 内置 fetch 做 HTTP 探测,零额外依赖

## 项目结构

```
src/
├── shared/types.ts                   # 共享数据模型
├── main/                             # Electron 主进程
│   ├── modules/
│   │   ├── scanner/                 # 端口扫描 + HTTP 探测
│   │   │   ├── port-scanner.ts       #   端口扫描(白名单与指纹库并集)
│   │   │   ├── http-prober.ts        #   HTTP 探测(title/server/body 提取)
│   │   │   └── index.ts             #   扫描流程编排
│   │   ├── recognizer/               # 指纹识别引擎
│   │   │   ├── fingerprints-data.ts  #   已知应用指纹库
│   │   │   └── index.ts             #   多特征加权匹配 + 自动命名链
│   │   └── process/                  # 端口 → PID → 进程名
│   └── ipc/index.ts                 # IPC 路由
├── preload/                          # 安全上下文桥
└── renderer/                         # React UI
    └── src/
        ├── components/AppCard.tsx
        ├── features/dashboard/      # Dashboard + 分类配置
        ├── hooks/useDiscoveredApps.ts
        └── styles/index.css         # 设计令牌 + 组件样式
```

## 快速开始

```bash
npm install
npm run dev        # 开发模式 (HMR 热重载)
npm run dist       # 打包 Windows 便携版 .exe
npm run typecheck  # 类型检查
```

## 使用说明

1. 启动应用,自动扫描本机所有监听端口
2. 按 `R` 键或点击 `scan` 按钮重新扫描
3. 卡片点击即可在浏览器打开对应 Web UI
4. 鼠标悬停卡片显示 `open ↗` / `kill` 操作

## 识别引擎

### 指纹匹配(已知应用)

匹配优先级与置信度:

| 信号 | 置信度 |
|------|--------|
| 进程名 + 端口匹配 | 0.95 |
| 仅进程名匹配 | 0.90 |
| 端口 + 页面标题匹配 | 0.85 |
| 端口 + favicon 匹配 | 0.80 |
| 端口 + body/server 匹配 | 0.75 |
| 仅端口匹配 | 0.40 |

### 自动命名链(未知应用)

未命中指纹库时,按以下优先级自动获取名称:

1. HTML `<title>` — 过滤 "localhost"、"Index of" 等无意义值
2. 进程名 — 自动去扩展名 (ollama.exe → ollama)
3. Server 响应头 — 如 Python/3.11、nginx
4. 兜底 — `127.0.0.1:port`

### 自动归类

未识别应用根据特征自动推断分类:

- `python` / `uvicorn` / `gunicorn` → AI·LOCAL 或 DEV
- `clash` / `proxy` → PROXY
- `mysql` / `postgres` → DB
- `docker` / `portainer` → CONTAINER

## 新增应用指纹

在 `src/main/modules/recognizer/fingerprints-data.ts` 中添加:

```typescript
{
  id: 'my-app',
  name: 'My App',
  category: 'ai-local',
  defaultPorts: [3000],
  titleKeywords: ['my app'],
  processKeywords: ['myapp']
}
```

端口会自动并入扫描列表,无需手动维护。


## 版本历史

### v0.2.0 (2026-08-21)

- **智能扫描**: 合并系统所有监听端口 + 白名单,不再遗漏自定义端口服务
- **自动命名**: 未知应用按 HTML title → 进程名 → Server 自动命名
- **自动归类**: 未知应用按进程/服务器特征推断分类(AI·LOCAL/DEV/PROXY 等)
- **Web UI 过滤**: 只保留返回 HTTP 响应的服务
- **无分类标签**: 识别不出的应用不显示分类标签,保持界面简洁
- **窗口标题**: WebUI Hub → Porthole
- **HTTP 超时**: 2s → 5s,减少慢服务漏探测

### v0.1.0 (2026-08-21)

- 初始版本:端口扫描 + 指纹识别 + 卡片展示

## License

MIT
