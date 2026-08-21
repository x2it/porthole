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

    // 合并:所有正在监听的端口 + 白名单端口
    // 这样既能发现自定义端口上的真实服务,又不漏掉白名单中的常见端口
    const { getScanPorts } = await import('../modules/scanner/port-scanner')
    const whitelist = getScanPorts()
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
