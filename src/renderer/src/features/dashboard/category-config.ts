import type { AppCategory, HealthStatus } from '@shared/types'

interface CategoryConfig {
  label: string
  /** 标签样式 - 全部中性灰,通过文字本身区分类别 */
  className: string
}

/**
 * 分类标签 - 全部中性色,不用颜色区分类别
 * 极客工具的克制:让信息本身说话,不让色彩喧宾夺主
 */
export const CATEGORY_CONFIG: Record<AppCategory, CategoryConfig> = {
  'ai-local': { label: 'AI·LOCAL', className: 'bg-bg-subtle text-text-primary' },
  'ai-cloud': { label: 'AI·CLOUD', className: 'bg-bg-subtle text-text-primary' },
  'dev-tool': { label: 'DEV', className: 'bg-bg-subtle text-text-muted' },
  database: { label: 'DB', className: 'bg-bg-subtle text-text-muted' },
  media: { label: 'MEDIA', className: 'bg-bg-subtle text-text-muted' },
  proxy: { label: 'PROXY', className: 'bg-bg-subtle text-text-muted' },
  container: { label: 'CONTAINER', className: 'bg-bg-subtle text-text-muted' },
  unknown: { label: 'UNKNOWN', className: 'bg-transparent text-text-faint border border-border-faint' }
}

/** 健康状态 → 状态点颜色 */
export const HEALTH_DOT: Record<HealthStatus, string> = {
  healthy: 'bg-status-ok',
  unresponsive: 'bg-status-err',
  checking: 'bg-status-warn animate-pulse',
  unknown: 'bg-text-faint'
}
