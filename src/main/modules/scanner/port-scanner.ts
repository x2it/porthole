import net from 'node:net'
import { FINGERPRINTS } from '../recognizer/fingerprints-data'

export interface PortScanResult {
  port: number
  open: boolean
}

export const DEFAULT_PORTS: number[] = [
  11434, 1234, 1337, 3000, 7860, 5000, 8000, 8888,
  5173, 4200, 3001, 8080,
  5432, 3306,
  9000, 2375,
  1080, 7890,
  80, 443, 8081, 8082, 8443
]

export function getScanPorts(): number[] {
  const set = new Set<number>(DEFAULT_PORTS)
  for (const fp of FINGERPRINTS) {
    if (fp.defaultPorts) {
      for (const p of fp.defaultPorts) set.add(p)
    }
  }
  return [...set].sort((a, b) => a - b)
}

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

export async function scanPorts(
  host: string,
  ports: number[] = getScanPorts(),
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
