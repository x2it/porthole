import type { DiscoveredApp } from '@shared/types'
import { CATEGORY_CONFIG, HEALTH_DOT } from '../features/dashboard/category-config'

interface AppCardProps {
  app: DiscoveredApp
  onOpen: (url: string) => void
  onKill: (pid: number) => void
}

// 通用进程序列名,无需额外显示
const GENERIC_PROCESS_NAMES = new Set(['python', 'python.exe', 'node', 'node.exe', 'java', 'java.exe', 'ruby', 'perl', 'php', 'go'])

function isGenericProcessName(name: string): boolean {
  return GENERIC_PROCESS_NAMES.has(name.toLowerCase().trim())
}

export function AppCard({ app, onOpen, onKill }: AppCardProps): JSX.Element {
  const category = CATEGORY_CONFIG[app.category]
  const healthDot = HEALTH_DOT[app.health]
  const isUnknown = app.category === 'unknown'
  const confidencePct = Math.round(app.confidence * 100)

  // 判断名称是否为自动生成的 PID 名(如 "PID 3692"),若是则不重复显示进程信息
  const isAutoNamed = /^PID \d+$/.test(app.name)

  return (
    <div
      className="card group cursor-pointer"
      onClick={() => onOpen(app.url)}
    >
      {/* 行 1:状态点 + 名称 + 分类标签 */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`dot ${healthDot}`} title={app.health} />
        <h3 className="text-sm font-medium text-text-primary truncate flex-1">
          {app.name}
        </h3>
        {category.label && (
          <span className={`tag ${category.className}`}>{category.label}</span>
        )}
      </div>

      {/* 行 2:URL */}
      <div className="mono text-text-muted mb-1.5 truncate">
        {app.url}
      </div>

      {/* 行 3:元信息 - 简洁,避免与名称/URL 重复 */}
      {app.process && !isAutoNamed && (
        <div className="flex items-center gap-1.5 mono text-text-faint mb-1.5 text-2xs">
          {/* 进程名仅在与应用名不同时显示 */}
          {app.process.name && app.process.name !== app.name && !isGenericProcessName(app.process.name) && (
            <>
              <span className="text-text-muted truncate max-w-[120px]">{app.process.name}</span>
              <span className="text-border">·</span>
            </>
          )}
          <span className="text-text-faint/70">pid:{app.process.pid}</span>
          {/* 置信度仅在命中指纹时显示 */}
          {!isUnknown && confidencePct > 0 && (
            <>
              <span className="text-border">·</span>
              <span className="text-status-ok/70">{confidencePct}%</span>
            </>
          )}
        </div>
      )}

      {/* 行 4:操作 */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-100">
        <button
          className="btn-ghost"
          onClick={(e) => { e.stopPropagation(); onOpen(app.url) }}
        >
          open ↗
        </button>
        {app.process && (
          <button
            className="btn-danger"
            onClick={(e) => { e.stopPropagation(); onKill(app.process!.pid) }}
            title={`kill -9 ${app.process.pid}`}
          >
            kill
          </button>
        )}
      </div>
    </div>
  )
}
