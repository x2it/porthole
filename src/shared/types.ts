/**
 * 共享类型定义 - 主进程与渲染进程共用的数据模型
 */

/** 应用类型分类 */
export type AppCategory =
  | 'ai-local'      // 本地 AI(Ollama / LM Studio / Jan 等)
  | 'ai-cloud'      // 云端 AI 代理
  | 'dev-tool'      // 开发工具(Jupyter / Code Server 等)
  | 'database'      // 数据库管理(pgAdmin / Adminer 等)
  | 'media'         // 媒体服务
  | 'proxy'         // 代理工具
  | 'container'     // 容器管理
  | 'unknown'

/** 应用健康状态 */
export type HealthStatus = 'healthy' | 'unresponsive' | 'checking' | 'unknown'

/** 发现的本地应用 */
export interface DiscoveredApp {
  /** 唯一 ID(基于 host:port) */
  id: string
  /** 显示名称(识别成功为应用名,否则为 host:port) */
  name: string
  /** 主机地址,通常为 127.0.0.1 或 localhost */
  host: string
  /** 端口号 */
  port: number
  /** 完整 URL */
  url: string
  /** 应用类型分类 */
  category: AppCategory
  /** 识别置信度 0-1,低于阈值标记为未识别 */
  confidence: number
  /** 关联的本地进程信息,无则为 null */
  process: ProcessInfo | null
  /** HTTP 探测响应,无则为 null */
  probe: HttpProbe | null
  /** 当前健康状态 */
  health: HealthStatus
  /** 应用图标 URL(优先 favicon) */
  iconUrl: string | null
  /** 最后一次扫描发现时间戳 */
  discoveredAt: number
}

/** 进程信息 */
export interface ProcessInfo {
  pid: number
  /** 进程名,如 ollama.exe / python.exe */
  name: string
  /** 可执行文件完整路径 */
  path?: string
  /** 启动命令行 */
  cmdline?: string
}

/** HTTP 探测结果 */
export interface HttpProbe {
  /** HTTP 状态码,如 200 */
  statusCode: number
  /** 响应头中的 Server 字段 */
  server: string | null
  /** 响应头中的 Content-Type */
  contentType: string | null
  /** HTML <title> 标签内容 */
  pageTitle: string | null
  /** favicon 路径(相对或绝对) */
  favicon: string | null
  /** 响应体前 N 个字符,用于特征匹配 */
  bodySnippet: string | null
}

/** 应用识别指纹 - 用于匹配已知应用 */
export interface AppFingerprint {
  /** 应用唯一标识,如 'ollama' / 'lm-studio' */
  id: string
  /** 显示名称 */
  name: string
  /** 应用分类 */
  category: AppCategory
  /** 官网或文档地址 */
  homepage?: string
  /** 默认端口列表 */
  defaultPorts?: number[]
  /** favicon 路径关键字 */
  faviconKeywords?: string[]
  /** 页面标题关键字 */
  titleKeywords?: string[]
  /** Server 响应头关键字 */
  serverKeywords?: string[]
  /** HTML body 关键字 */
  bodyKeywords?: string[]
  /** 进程名关键字(不区分大小写) */
  processKeywords?: string[]
}
