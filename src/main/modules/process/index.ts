import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { ProcessInfo } from '@shared/types'

const execAsync = promisify(exec)

const isWindows = process.platform === 'win32'

/**
 * 一次性解析所有 TCP 端口对应的进程信息
 * Windows: netstat -ano + tasklist
 * Unix:   lsof -iTCP -sTCP:LISTEN -P -n
 */
export async function resolveAllPortProcesses(): Promise<Map<number, ProcessInfo>> {
  const portMap = new Map<number, ProcessInfo>()

  if (isWindows) {
    await resolveWindows(portMap)
  } else {
    await resolveUnix(portMap)
  }

  return portMap
}

async function resolveWindows(portMap: Map<number, ProcessInfo>): Promise<void> {
  // 1) 获取所有监听端口 → PID 映射
  const { stdout: netstatOut } = await execAsync('netstat -ano', { maxBuffer: 10 * 1024 * 1024 })
  const pidByPort = new Map<number, number>()

  for (const line of netstatOut.split('\n')) {
    const trimmed = line.trim()
    // 形如: TCP    127.0.0.1:11434    0.0.0.0:0    LISTENING    12345
    const match = trimmed.match(/TCP\s+\S+:(\d+)\s+\S+\s+LISTENING\s+(\d+)/)
    if (match) {
      const port = parseInt(match[1], 10)
      const pid = parseInt(match[2], 10)
      if (port && pid) pidByPort.set(port, pid)
    }
  }

  if (pidByPort.size === 0) return

  // 2) 查询所有进程信息 - 一次性获取全部进程列表再匹配
  const pids = [...new Set(pidByPort.values())]
  const processByName = new Map<number, ProcessInfo>()

  try {
    // 获取所有进程列表(比逐个查询快得多)
    const { stdout } = await execAsync(
      'tasklist /FO CSV /NH',
      { maxBuffer: 10 * 1024 * 1024 }
    )
    parseTasklistCsv(stdout, processByName)
  } catch {
    // fallback: 逐个查询
    for (const pid of pids) {
      try {
        const { stdout } = await execAsync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`,
          { maxBuffer: 1024 * 1024 }
        )
        parseTasklistCsv(stdout, processByName)
      } catch { /* ignore */ }
    }
  }

  // 3) 合并:port → ProcessInfo
  for (const [port, pid] of pidByPort) {
    const info = processByName.get(pid)
    if (info) {
      portMap.set(port, { ...info, pid })
    }
    // 查不到进程名时不设置 name,让 fallbackName 处理
  }
}

function parseTasklistCsv(stdout: string, out: Map<number, ProcessInfo>): void {
  const lines = stdout.split('\n').filter((l) => l.trim())
  for (const line of lines) {
    // CSV: "image","pid","session","sessionnum","mem"
    const cols = line.split('","').map((c) => c.replace(/^"|"$/g, ''))
    if (cols.length >= 2) {
      const name = cols[0]
      const pid = parseInt(cols[1], 10)
      if (name && pid) {
        out.set(pid, { pid, name })
      }
    }
  }
}

async function resolveUnix(portMap: Map<number, ProcessInfo>): Promise<void> {
  try {
    const { stdout } = await execAsync('lsof -iTCP -sTCP:LISTEN -P -n', { maxBuffer: 10 * 1024 * 1024 })
    for (const line of stdout.split('\n').slice(1)) {
      const trimmed = line.trim()
      if (!trimmed) continue
      // COMMAND PID USER ... TYPE NODE NAME (e.g. 127.0.0.1:11434)
      const parts = trimmed.split(/\s+/)
      const name = parts[0]
      const pid = parseInt(parts[1], 10)
      const nameField = parts[parts.length - 1]
      const portMatch = nameField?.match(/:(\d+)$/)
      if (name && pid && portMatch) {
        const port = parseInt(portMatch[1], 10)
        portMap.set(port, { pid, name })
      }
    }
  } catch {
    // lsof 不可用或需要权限
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size))
  }
  return result
}
