import { ipcMain, BrowserWindow, shell } from 'electron'
import { discoverApps, type ScanProgress } from '../modules/scanner'
import { resolveAllPortProcesses } from '../modules/process'

/** IPC channel 名称常量 - 避免字符串硬编码 */
export const Channels = {
  DISCOVER: 'scanner:discover',
  PROGRESS: 'scanner:progress',
  OPEN_URL: 'app:open-url',
  KILL_PROCESS: 'app:kill-process'
} as const

/**
 * 注册所有 IPC handlers - 模块化入口
 */
export function registerIpcHandlers(getMainWindow: () => BrowserWindow | null): void {
  // 触发扫描
  ipcMain.handle(Channels.DISCOVER, async () => {
    const mainWindow = getMainWindow()
    const processMap = await resolveAllPortProcesses()

    // 合并:所有正在监听的端口 + 白名单端口(内置 + 用户指纹库)
    const { getScanPorts } = await import('../modules/scanner/port-scanner')
    const builtinPorts = getScanPorts()
    
    // 用户自定义指纹端口 - 直接读取 JSON 文件
    const userPorts = loadUserFingerprintPorts()
    const whitelist = [...new Set([...builtinPorts, ...userPorts])]
    
    const listeningPorts = [...processMap.keys()]
    const allPorts = [...new Set([...whitelist, ...listeningPorts])].sort((a, b) => a - b)

    const apps = await discoverApps(
      { ports: allPorts },
      (port) => processMap.get(port) ?? null,
      (progress: ScanProgress) => {
        mainWindow?.webContents.send(Channels.PROGRESS, progress)
      }
    )
    return apps
  })

  // 在系统默认浏览器打开 URL
  ipcMain.handle(Channels.OPEN_URL, async (_event, url: string) => {
    await shell.openExternal(url)
    return true
  })

/**
 * 从 fingerprints.json 加载用户自定义指纹的端口
 * 直接同步读取,避免 tree-shaking 问题
 */
function loadUserFingerprintPorts(): number[] {
  try {
    const { existsSync, readFileSync } = require('node:fs')
    const { join } = require('node:path')
    const candidates = [
      join(process.cwd(), 'fingerprints.json'),
      join(process.env.APPDATA ?? '', 'porthole', 'fingerprints.json'),
    ]
    const ports = new Set<number>()
    for (const p of candidates) {
      if (p && existsSync(p)) {
        try {
          const data = JSON.parse(readFileSync(p, 'utf-8'))
          if (Array.isArray(data)) {
            for (const fp of data) {
              for (const port of (fp.defaultPorts ?? [])) {
                if (typeof port === 'number') ports.add(port)
              }
            }
          }
        } catch {}
      }
    }
    return [...ports]
  } catch {
    return []
  }
}

  // kill 进程(Windows: taskkill /F /PID xxx)
  ipcMain.handle(Channels.KILL_PROCESS, async (_event, pid: number) => {
    try {
      const { exec } = await import('node:child_process')
      const { promisify } = await import('node:util')
      const execAsync = promisify(exec)
      const cmd = process.platform === 'win32'
        ? `taskkill /F /PID ${pid}`
        : `kill -9 ${pid}`
      await execAsync(cmd)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })
}
