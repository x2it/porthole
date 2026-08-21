import type { HttpProbe } from '@shared/types'

/**
 * HTTP 探测 - 请求目标端口并提取识别特征
 * 用 Node 18+ 内置 fetch,0 依赖
 */
export async function probeHttp(url: string, timeoutMs = 5000): Promise<HttpProbe | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'WebUIHub/0.1 (local scanner)' }
    })

    const server = res.headers.get('server')
    const contentType = res.headers.get('content-type')

    // 仅处理 HTML 响应
    const isHtml = contentType?.includes('text/html')
    const body = isHtml ? await res.text() : null
    const bodySnippet = body ? body.slice(0, 2000) : null

    let pageTitle: string | null = null
    let favicon: string | null = null

    if (body) {
      const titleMatch = body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      pageTitle = titleMatch ? titleMatch[1].trim().slice(0, 200) : null

      // 提取 favicon link
      const favMatch = body.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i)
        || body.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["'](?:shortcut )?icon["']/i)
      favicon = favMatch ? favMatch[1] : '/favicon.ico'
    }

    return {
      statusCode: res.status,
      server,
      contentType,
      pageTitle,
      favicon,
      bodySnippet
    }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 解析 favicon 相对路径为完整 URL
 */
export function resolveFavicon(baseUrl: string, favicon: string | null): string | null {
  if (!favicon) return null
  try {
    return new URL(favicon, baseUrl).href
  } catch {
    return null
  }
}
