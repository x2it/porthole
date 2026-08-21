import type { DiscoveredApp } from '@shared/types'
import { CATEGORY_CONFIG, HEALTH_DOT } from '../features/dashboard/category-config'

interface AppCardProps {
  app: DiscoveredApp
  onOpen: (url: string) => void
  onKill: (pid: number) => void
}

export function AppCard({ app, onOpen, onKill }: AppCardProps): JSX.Element {
  const category = CATEGORY_CONFIG[app.category]
  const healthDot = HEALTH_DOT[app.health]
  const isUnknown = app.category === 'unknown'
  const confidencePct = Math.round(app.confidence * 100)

  return (
    <div
      className="card group cursor-pointer"
      onClick={() => onOpen(app.url)}
    >
      {/* 行 1:状态点 + 名称 + 分类标签 + 端口 */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`dot ${healthDot}`} title={app.health} />
        <h3 className="text-sm font-medium text-text-primary truncate flex-1">
          {app.name}
        </h3>
        <span className={`tag ${category.className}`}>{category.label}</span>
      </div>

      {/* 行 2:URL - 等宽显示 */}
      <div className="mono text-text-muted mb-2 truncate">
        {app.url}
      </div>

      {/* 行 3:技术元信息 - 等宽,密集 */}
      <div className="flex items-center gap-3 mono text-text-faint mb-2.5">
        <span>:<span className="text-text-muted">{app.port}</span></span>
        {app.process ? (
          <>
            <span className="text-border-strong">·</span>
            <span className="truncate">{app.process.name}</span>
            <span className="text-border-strong">·</span>
            <span>pid:{app.process.pid}</span>
          </>
        ) : (
          <span className="text-text-faint">no-process</span>
        )}
        {!isUnknown && (
          <>
            <span className="text-border-strong">·</span>
            <span className="text-status-ok/80">{confidencePct}%</span>
          </>
        )}
      </div>

      {/* 行 4:操作 - 默认隐藏,hover 显露,无大按钮 */}
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
