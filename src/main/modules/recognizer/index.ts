import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
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

// 合并内置 + 用户指纹(用户指纹优先)
const _allFingerprints: AppFingerprint[] = [...loadUserFingerprints(), ...FINGERPRINTS]

/**
 * 获取所有指纹的默认端口(供扫描使用)
 */
export function getAllFingerprintPorts(): number[] {
  const ports = new Set<number>()
  for (const fp of _allFingerprints) {
    for (const p of (fp.defaultPorts ?? [])) {
      ports.add(p)
    }
  }
  return [...ports]
}

function loadUserFingerprints(): AppFingerprint[] {
  try {
    const candidates = [
      join(process.cwd(), 'fingerprints.json'),
      join(process.env.APPDATA ?? '', 'porthole', 'fingerprints.json'),
    ]
    for (const p of candidates) {
      if (p && existsSync(p)) {
        const data = JSON.parse(readFileSync(p, 'utf-8'))
        if (Array.isArray(data)) {
          console.log(`[recognizer] loaded ${data.length} user fingerprints from ${p}`)
          return data as AppFingerprint[]
        }
      }
    }
  } catch (e) {
    console.warn('[recognizer] failed to load user fingerprints:', e)
  }
  return []
}

export function recognize(input: RecognizerInput): RecognizerResult {
  const { probe, process, port } = input

  for (const fp of _allFingerprints) {
    const score = scoreFingerprint(fp, probe, process, port)
    if (score >= 0.3) {
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
  const bodySnippet = (probe?.bodySnippet ?? '').toLowerCase()
  const pageTitle = (probe?.pageTitle ?? '').toLowerCase()

  // AI 本地工具
  if (/ollama|lmstudio|lm.studio|comfyui|automatic1111|sd-webui|stable.diffusion|invokeai|fooocus|a1111/i.test(procName))
    return 'ai-local'
  if (/python|uvicorn|gunicorn|gradio|streamlit|jupyter|ipython/i.test(procName))
    return /gradio|streamlit|jupyter/i.test(procName) ? 'ai-local' : 'dev-tool'

  // AI 云端/在线
  if (/librechat|chatbox|better.chat|nextchat|chatbox|lobechat|kobold/i.test(procName))
    return 'ai-cloud'
  if (/librechat|chat|webui/i.test(pageTitle) || /librechat|chat/i.test(bodySnippet))
    return 'ai-cloud'

  // 开发工具
  if (/node|npm|vite|webpack|react|next|nuxt|angular|svelte|vue|flask|django|fastapi|spring|rails|express/i.test(procName))
    return 'dev-tool'
  if (/python|ruby|perl|php|go|rust|elixir|cargo/i.test(procName))
    return 'dev-tool'

  // 代理
  if (/clash|proxy|socks|v2ray|trojan|shadowsocks|xray|sing-box|hysteria/i.test(procName))
    return 'proxy'

  // 容器
  if (/docker|portainer|containerd|k8s|kubelet/i.test(procName))
    return 'container'

  // 数据库
  if (/mysql|postgres|postgresql|mongo|mongodb|redis|mariadb|sqlite|oracle|sqlserver/i.test(procName))
    return 'database'

  // 媒体
  if (/plex|jellyfin|emby|transmission|qbittorrent|deluge|sonarr|radarr/i.test(procName))
    return 'media'

  // 监控
  if (/grafana|prometheus|jaeger|zipkin|kibana|elasticsearch|logstash/i.test(procName))
    return 'monitoring'

  // HTTP Server 特征
  if (/python/i.test(server)) return 'dev-tool'
  if (/nginx|apache|caddy|lighttpd|iis/i.test(server)) return 'dev-tool'
  if (/node|express|koa|hapi/i.test(server)) return 'dev-tool'
  if (/gunicorn|uvicorn/i.test(server)) return 'dev-tool'

  // Body 特征
  if (/gradio|streamlit|ollama|comfyui|jupyter/i.test(bodySnippet))
    return 'ai-local'
  if (/swagger|openapi|fastapi|flask|django/i.test(bodySnippet))
    return 'dev-tool'

  // 端口特征
  const portCategory = getCategoryByPort(port)
  if (portCategory) return portCategory

  return 'unknown'
}

/**
 * 根据端口号推断分类 - 兜底逻辑
 */
function getCategoryByPort(port: number): AppCategory | null {
  const portMap: Record<number, AppCategory> = {
    11434: 'ai-local',   // Ollama
    1234: 'ai-local',    // LM Studio
    1337: 'ai-local',    // Jan
    3000: 'dev-tool',    // 通用开发
    5000: 'dev-tool',    // Flask
    5173: 'dev-tool',    // Vite
    7860: 'ai-local',    // Gradio / SD WebUI
    8000: 'dev-tool',    // FastAPI
    8080: 'dev-tool',    // 通用
    8888: 'dev-tool',    // Jupyter
    8188: 'ai-local',    // ComfyUI
    8501: 'dev-tool',    // Streamlit
    3080: 'ai-cloud',    // LibreChat
    5432: 'database',    // PostgreSQL
    3306: 'database',    // MySQL
    27017: 'database',   // MongoDB
    6379: 'database',    // Redis
    9000: 'monitoring', // Prometheus
    3001: 'dev-tool',
    4200: 'dev-tool',
    2375: 'container',
    1080: 'proxy',
    7890: 'proxy',
  }
  return portMap[port] ?? null
}

function fallbackName(
  probe: HttpProbe | null,
  process: ProcessInfo | null,
  port: number
): string {
  // 1) HTML title (最可靠)
  if (probe?.pageTitle) {
    const t = probe.pageTitle.trim()
    if (t && t.length >= 2 && !isGenericTitle(t)) {
      return t
    }
  }

  // 2) Server 响应头 (如 "Python/3.10"、"nginx" 等)
  if (probe?.server) {
    const s = probe.server.trim()
    if (s && s.length >= 2 && !isGenericServer(s)) {
      return s
    }
  }

  // 3) 端口对应已知指纹名(通过端口匹配到的指纹)
  //    如果命中过指纹(哪怕端口匹配),优先用指纹名
  //    这部分由 recognize() 返回,此处 fallback 只处理未命中的情况
  
  // 4) 进程名 - 仅在友好时显示
  if (process?.name) {
    const friendly = humanizeProcessName(process.name)
    if (friendly) return friendly
  }

  // 5) 兜底:端口号 + 服务标识
  return `Service :${port}`
}

/**
 * 判断 Server 响应头是否无意义(如 "BaseHTTP/0.6 Python" 这种技术标识)
 */
function isGenericServer(server: string): boolean {
  const s = server.toLowerCase()
  // 纯技术标识,对用户没意义
  if (/^basehttp\/\d/i.test(s)) return true
  if (/^python\//i.test(s)) return true
  if (/^simplehttp/i.test(s)) return true
  // 通用 web 服务器名有一定意义,保留
  return false
}

/**
 * 将进程序列名转为友好的人类可读名称
 * e.g. "orayfilesvr.exe" → "Oray File Service"
 * e.g. "TRAESOLO CN.exe" → "TRAE SOLO CN"
 * e.g. "node.exe" → "Node.js"
 */
function humanizeProcessName(rawName: string): string | null {
  // 去除扩展名
  let name = rawName.replace(/\.(exe|bin|app|cmd|sh|dll|service)$/i, '')
  
  // PID 自动名跳过
  if (/^PID \d+$/i.test(name)) return null
  
  // 已知映射表:可执行文件名 → 友好名
  const knownMap: Record<string, string> = {
    'node': 'Node.js',
    'python': 'Python',
    'java': 'Java',
    'ruby': 'Ruby',
    'php': 'PHP',
    'go': 'Go',
    'chrome': 'Chrome',
    'msedge': 'Edge',
    'firefox': 'Firefox',
    'code': 'VS Code',
    'trae': 'Trae',
    'ollama': 'Ollama',
    'lm studio': 'LM Studio',
    'lmstudio': 'LM Studio',
    'comfyui': 'ComfyUI',
    'pythonw': 'Python',
    'python3': 'Python',
    'uvicorn': 'Uvicorn',
    'gunicorn': 'Gunicorn',
    'orayfilesvr': '花生壳',
    'hskddns': 'HskDDNS',
    'phtunnel': 'Phtunnel',
    'oray': 'Oray',
  }
  
  const lower = name.toLowerCase().trim()
  if (knownMap[lower]) return knownMap[lower]
  
  // 驼峰转空格: "OrayFileSvr" → "Oray File Svr"
  let readable = name
  readable = readable.replace(/([a-z])([A-Z])/g, '$1 $2')
  // 下划线/连字符转空格
  readable = readable.replace(/[_-]+/g, ' ')
  // 连续空格压缩
  readable = readable.replace(/\s+/g, ' ').trim()
  
  // 判断是否"人类可读":
  // 1) 包含空格说明有拆分,较好
  // 2) 至少包含一个元音字母(a/e/i/o/u),否则多半是缩写
  // 3) 长度合理
  const hasSpaces = readable.includes(' ')
  const hasVowel = /[aeiouAEIOU]/.test(readable)
  const hasChinese = /[\u4e00-\u9fff]/.test(readable)
  
  if (!hasSpaces && !hasVowel && !hasChinese) return null
  if (readable.length < 2 || readable.length > 40) return null
  
  // 全是大写缩写且超过4字符 (如 "TRAESOLO"),不可读
  if (/^[A-Z]{4,}$/.test(readable)) return null
  
  // 首字母大写
  return readable.charAt(0).toUpperCase() + readable.slice(1)
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
