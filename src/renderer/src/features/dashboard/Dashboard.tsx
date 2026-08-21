import { useMemo, useEffect } from 'react'
import type { DiscoveredApp, ScanProgress } from '@shared/types'
import { AppCard } from '@components/AppCard'

interface DashboardProps {
  apps: DiscoveredApp[]
  phase: 'idle' | 'scanning' | 'done' | 'error'
  progress: ScanProgress | null
  error: string | null
  onScan: () => void
  onOpen: (url: string) => void
  onKill: (pid: number) => void
}

const PHASE_LABEL: Record<string, string> = {
  'scanning-ports': 'scanning ports',
  'probing-http': 'http probe',
  matching: 'matching',
  done: 'done'
}

export function Dashboard({ apps, phase, progress, error, onScan, onOpen, onKill }: DashboardProps): JSX.Element {
  const stats = useMemo(() => {
    const total = apps.length
    const matched = apps.filter((a) => a.confidence > 0).length
    const autoCategorized = apps.filter((a) => a.category !== 'unknown' && a.confidence === 0).length
    const unknown = total - matched - autoCategorized
    return { total, matched, autoCategorized, unknown }
  }, [apps])

  const isScanning = phase === 'scanning'

  // 快捷键:R 触发扫描
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if (e.key === 'r' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target as HTMLElement)?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault()
          if (!isScanning) onScan()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isScanning, onScan])

  return (
    <div className="flex flex-col h-full">
      {/* ============ Status Bar ============ */}
      <header className="flex items-center justify-between px-4 h-10 border-b border-border bg-bg-muted/50 backdrop-blur-sm flex-shrink-0">
        {/* 左:标识 */}
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-status-ok" />
          
          <span className="mono text-text-faint">v0.2.0</span>
        </div>

        {/* 中:状态 */}
        <div className="flex items-center gap-2 mono text-2xs text-text-muted">
          {isScanning && progress ? (
            <>
              <span className="dot bg-status-warn animate-pulse" />
              <span>{PHASE_LABEL[progress.phase] ?? progress.phase}</span>
              <span className="text-text-faint">{progress.current}/{progress.total}</span>
            </>
          ) : apps.length > 0 ? (
            <>
              <span className="dot bg-status-ok" />
              <span>{stats.total} services</span>
              {stats.matched > 0 && (
                <>
                  <span className="text-text-faint">·</span>
                  <span className="text-status-ok/80">{stats.matched} identified</span>
                </>
              )}
              {stats.autoCategorized > 0 && (
                <>
                  <span className="text-text-faint">·</span>
                  <span className="text-status-warn/70">{stats.autoCategorized} categorized</span>
                </>
              )}
              {stats.unknown > 0 && (
                <>
                  <span className="text-text-faint">·</span>
                  <span className="text-text-faint">{stats.unknown} pending</span>
                </>
              )}
            </>
          ) : (
            <>
              <span className="dot bg-text-faint" />
              <span>idle</span>
            </>
          )}
        </div>

        {/* 右:操作 + 快捷键 */}
        <div className="flex items-center gap-2">
          <span className="mono text-2xs text-text-faint hidden sm:inline">press</span>
          <kbd className="kbd">R</kbd>
          <button
            className="btn-primary"
            onClick={onScan}
            disabled={isScanning}
          >
            {isScanning ? 'scanning…' : 'scan'}
          </button>
        </div>
      </header>

      {/* ============ 主区 ============ */}
      <main className="flex-1 overflow-auto px-4 py-3">
        {error && (
          <div className="border border-status-err/30 bg-status-err/5 text-status-err text-xs px-3 py-2 rounded-card mono mb-3">
            <span className="text-status-err/80">error:</span> {error}
          </div>
        )}

        {phase === 'idle' && apps.length === 0 && (
          <EmptyState onScan={onScan} />
        )}

        {apps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2.5">
            {apps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onOpen={onOpen}
                onKill={onKill}
              />
            ))}
          </div>
        )}
      </main>

      {/* ============ 底部状态行 - 极客工具标配 ============ */}
      <footer className="flex items-center justify-between px-4 h-6 border-t border-border bg-bg-muted/30 mono text-2xs text-text-faint flex-shrink-0">
        <div className="flex items-center gap-3">
          <span>localhost · 127.0.0.1</span>
          <span>·</span>
          <span>{apps.length} services</span>
        </div>
        <div className="flex items-center gap-3">
          <span><span className="text-status-ok">●</span> healthy</span>
          <span><span className="text-status-warn">●</span> checking</span>
          <span><span className="text-status-err">●</span> down</span>
        </div>
      </footer>
    </div>
  )
}

function EmptyState({ onScan }: { onScan: () => void }): JSX.Element {
  return (
    <div className="flex flex-col items-start h-full justify-center px-2 max-w-md">
      <div className="mono text-2xs text-text-faint mb-2">$ porthole --scan</div>
      <h2 className="text-sm font-medium text-text-primary mb-1">No services discovered yet</h2>
      <p className="text-xs text-text-muted mb-4 leading-relaxed">
        扫描本机端口,自动识别 Ollama / LM Studio / ComfyUI 等 Web UI 服务。
      </p>
      <div className="flex items-center gap-3">
        <button className="btn-primary" onClick={onScan}>
          run scan
        </button>
        <span className="mono text-2xs text-text-faint">or press <kbd className="kbd">R</kbd></span>
      </div>
    </div>
  )
}
