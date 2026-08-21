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

/**
 * 应用识别引擎 - 数据驱动 + 多重特征加权
 *
 * 匹配优先级与置信度:
 *  1. 进程名匹配      → 0.90(最强信号)
 *  2. 默认端口 + 标题 → 0.80
 *  3. 默认端口 + favicon 关键字 → 0.75
 *  4. 标题关键字      → 0.65
 *  5. body / server 关键字 → 0.55
 *  6. 仅默认端口      → 0.40(弱信号)
 *  7. 无匹配          → 0,name 回退为 host:port
 */
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

  // 未识别 - 回退为 host:port
  return {
    name: `127.0.0.1:${port}`,
    category: 'unknown',
    confidence: 0,
    fingerprint: null
  }
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

  // 进程匹配 - 最强信号
  if (processMatch) {
    if (portMatch) return 0.95
    return 0.9
  }

  // 端口 + 任一 HTTP 特征
  if (portMatch) {
    if (titleMatch) return 0.85
    if (faviconMatch) return 0.8
    if (bodyMatch || serverMatch) return 0.75
    return 0.4 // 仅端口,弱信号
  }

  // 无端口匹配但 HTTP 特征明显
  if (titleMatch) return 0.7
  if (faviconMatch) return 0.65
  if (bodyMatch || serverMatch) return 0.55

  return 0
}

/**
 * 关键字匹配(大小写不敏感,任一命中即返回 true)
 */
function matchKeywords(text: string, keywords?: string[]): boolean {
  if (!keywords || keywords.length === 0) return false
  const lower = text.toLowerCase()
  return keywords.some((kw) => lower.includes(kw.toLowerCase()))
}
