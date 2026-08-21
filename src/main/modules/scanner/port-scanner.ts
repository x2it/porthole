import net from 'node:net'

/** 单端口扫描结果 */
export interface PortScanResult {
  port: number
  open: boolean
}

/** 默认扫描端口范围 - 覆盖常见本地 Web UI 服务 */
export const DEFAULT_PORTS: number[] = [
  // AI 本地服务
  11434, // Ollama
  1234,  // LM Studio
  1337,  // Jan
  3000,  // 通用 / Open WebUI
  7860,  // Gradio 默认
  5000,  // Flask 默认
  8000,  // Django / FastAPI 默认
  8888,  // Jupyter
  // 开发工具
  5173,  // Vite
  4200,  // Angular
  3001,  // React (create-react-app 备用)
  8080,  // 通用 Web
  // 数据库
  5432,  // PostgreSQL
  3306,  // MySQL
  // 容器管理
  9000,  // Portainer
  2375,  // Docker
  // 代理
  1080,  // SOCKS
  7890,  // Clash
  // 其他
  80, 443, 8081, 8082, 8443
]

/**
 * 扫描单个端口是否开放
 */
export function scanPort(host: string, port: number, timeoutMs = 500): Promise<PortScanResult> {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    let settled = false

    const done = (result: PortScanResult) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => done({ port, open: true }))
    socket.once('timeout', () => done({ port, open: false }))
    socket.once('error', () => done({ port, open: false }))

    socket.connect(port, host)
  })
}

/**
 * 批量并发扫描端口
 * @param host 目标主机
 * @param ports 端口列表
 * @param concurrency 并发数
 */
export async function scanPorts(
  host: string,
  ports: number[] = DEFAULT_PORTS,
  concurrency = 50
): Promise<PortScanResult[]> {
  const results: PortScanResult[] = []
  const queue = [...ports]

  const worker = async (): Promise<void> => {
    while (queue.length > 0) {
      const port = queue.shift()
      if (port === undefined) break
      results.push(await scanPort(host, port))
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, ports.length) }, () => worker())
  await Promise.all(workers)

  return results
}
