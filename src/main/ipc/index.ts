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

    const apps = await discoverApps(
      {},
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
