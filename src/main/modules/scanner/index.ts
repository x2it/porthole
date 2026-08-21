import type { DiscoveredApp, ProcessInfo } from '@shared/types'
import { scanPorts, type PortScanResult } from './port-scanner'
import { probeHttp, resolveFavicon } from './http-prober'
import { recognize } from '../recognizer'

export interface ScanOptions {
  host?: string
  ports?: number[]
  concurrency?: number
}

export interface ScanProgress {
  phase: 'scanning-ports' | 'probing-http' | 'matching' | 'done'
  current: number
  total: number
}

/**
 * 完整扫描流程:端口扫描 → HTTP 探测 → 应用识别
 */
export async function discoverApps(
  options: ScanOptions = {},
  processResolver?: (port: number) => ProcessInfo | null,
  onProgress?: (progress: ScanProgress) => void
): Promise<DiscoveredApp[]> {
  const host = options.host ?? '127.0.0.1'
  const ports = options.ports

  // 阶段 1:端口扫描
  onProgress?.({ phase: 'scanning-ports', current: 0, total: ports?.length ?? 0 })
  const portResults: PortScanResult[] = await scanPorts(host, ports)
  const openPorts = portResults.filter((r) => r.open)

  // 阶段 2:HTTP 探测
  const discovered: DiscoveredApp[] = []
  for (let i = 0; i < openPorts.length; i++) {
    const { port } = openPorts[i]
    onProgress?.({ phase: 'probing-http', current: i + 1, total: openPorts.length })

    const url = `http://${host}:${port}`
    const [probe, process] = await Promise.all([
      probeHttp(url),
      Promise.resolve(processResolver?.(port) ?? null)
    ])

    // 阶段 3:识别
    const { name, category, confidence, fingerprint } = recognize({ probe, process, port })

    const iconUrl = probe?.favicon
      ? resolveFavicon(url, probe.favicon)
      : null

    discovered.push({
      id: `${host}:${port}`,
      name,
      host,
      port,
      url,
      category,
      confidence,
      process,
      probe,
      health: probe ? 'healthy' : 'unknown',
      iconUrl,
      discoveredAt: Date.now()
    })

    // 阶段标识:匹配完成(对每个 app 即时)
    onProgress?.({ phase: 'matching', current: i + 1, total: openPorts.length })
  }

  onProgress?.({ phase: 'done', current: openPorts.length, total: openPorts.length })
  return discovered
}

export { scanPorts, DEFAULT_PORTS } from './port-scanner'
export { probeHttp, resolveFavicon } from './http-prober'
