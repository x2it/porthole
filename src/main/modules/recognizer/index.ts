import type { AppFingerprint, AppCategory, HttpProbe, ProcessInfo } from '@shared/types'
import { FINGERPRINTS } from './fingerprints-data'

export interface RecognizerInput {
  probe: HttpProbe | null
  process: ProcessInfo | null
  port: number
}

export interface RecognizerResult {
  name: string
  category: AppCategory
  confidence: number
  fingerprint: AppFingerprint | null
}

export function recognize(input: RecognizerInput): RecognizerResult {
  const { probe, process, port } = input

  for (const fp of FINGERPRINTS) {
    const score = scoreFingerprint(fp, probe, process, port)
    if (score >= 0.4) {
      return {
        name: fp.name,
        category: fp.category,
        confidence: score,
        fingerprint: fp
      }
    }
  }

  return {
    name: fallbackName(probe, process, port),
    category: inferCategory(probe, process, port),
    confidence: 0,
    fingerprint: null
  }
}

/**
 * 自动推断分类 - 未命中指纹库时,根据进程名/服务器类型/端口特征归类
 */
function inferCategory(
  probe: HttpProbe | null,
  process: ProcessInfo | null,
  port: number
): AppCategory {
  const procName = (process?.name ?? '').toLowerCase()
  const server = (probe?.server ?? '').toLowerCase()

  // AI / Dev 相关
  if (/python|uvicorn|gunicorn|gradio|streamlit|jupyter|ollama|lmstudio|comfyui/i.test(procName)) {
    return 'ai-local'
  }
  if (/python|uvicorn|gunicorn|flask|django|fastapi|node|vite|react|angular|next/i.test(procName)) {
    return 'dev-tool'
  }

  // 代理
  if (/clash|proxy|socks|v2ray|trojan|shadowsocks/i.test(procName)) {
    return 'proxy'
  }

  // 容器
  if (/docker|portainer|containerd/i.test(procName)) {
    return 'container'
  }

  // 数据库
  if (/mysql|postgres|mongo|redis|mariadb|sqlite/i.test(procName)) {
    return 'database'
  }

  // 媒体
  if (/plex|jellyfin|emby|transmission|qbittorrent/i.test(procName)) {
    return 'media'
  }

  // 云端 AI
  if (/librechat|chat|webui/i.test(procName)) {
    return 'ai-cloud'
  }

  // Server 头辅助判断
  if (/python/i.test(server)) return 'dev-tool'
  if (/nginx|apache|caddy/i.test(server)) return 'dev-tool'

  return 'unknown'
}

function fallbackName(
  probe: HttpProbe | null,
  process: ProcessInfo | null,
  port: number
): string {
  if (probe?.pageTitle) {
    const t = probe.pageTitle.trim()
    if (t && t.length >= 2 && !isGenericTitle(t)) {
      return t
    }
  }

  if (process?.name) {
    const name = process.name.replace(/\.(exe|bin|app|cmd|sh)$/i, '')
    if (name && name.length >= 2) return name
  }

  if (probe?.server) {
    return probe.server
  }

  return `127.0.0.1:${port}`
}

function isGenericTitle(title: string): boolean {
  const lower = title.toLowerCase().trim()
  const generic = [
    'localhost', '127.0.0.1', 'index of', 'directory listing',
    'home', 'welcome', 'page', 'untitled', 'new tab',
    'localhost:', '0.0.0.0', 'not found', '404', '502', '503',
    'iis', 'apache', 'nginx'
  ]
  if (generic.some((g) => lower === g || lower.startsWith(g))) return true
  if (!/[a-z\u4e00-\u9fff]/i.test(title)) return true
  if (title.length > 60) return true
  return false
}

function scoreFingerprint(
  fp: AppFingerprint,
  probe: HttpProbe | null,
  process: ProcessInfo | null,
  port: number
): number {
  const portMatch = fp.defaultPorts?.includes(port) ?? false
  const processMatch = process && matchKeywords(process.name, fp.processKeywords)
  const titleMatch = probe?.pageTitle && matchKeywords(probe.pageTitle, fp.titleKeywords)
  const faviconMatch = probe?.favicon && matchKeywords(probe.favicon, fp.faviconKeywords)
  const serverMatch = probe?.server && matchKeywords(probe.server, fp.serverKeywords)
  const bodyMatch = probe?.bodySnippet && matchKeywords(probe.bodySnippet, fp.bodyKeywords)

  if (processMatch) {
    if (portMatch) return 0.95
    return 0.9
  }

  if (portMatch) {
    if (titleMatch) return 0.85
    if (faviconMatch) return 0.8
    if (bodyMatch || serverMatch) return 0.75
    return 0.4
  }

  if (titleMatch) return 0.7
  if (faviconMatch) return 0.65
  if (bodyMatch || serverMatch) return 0.55

  return 0
}

function matchKeywords(text: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return false
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}
