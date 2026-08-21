import { contextBridge, ipcRenderer } from 'electron'
import type { DiscoveredApp, ScanProgress } from '../shared/types'

const api = {
  /** 触发一次扫描 */
  discover: (): Promise<DiscoveredApp[]> => ipcRenderer.invoke('scanner:discover'),

  /** 监听扫描进度 */
  onProgress: (callback: (progress: ScanProgress) => void): (() => void) => {
    const handler = (_event: unknown, progress: ScanProgress): void => callback(progress)
    ipcRenderer.on('scanner:progress', handler)
    return () => ipcRenderer.removeListener('scanner:progress', handler)
  },

  /** 在系统浏览器中打开 URL */
  openUrl: (url: string): Promise<boolean> => ipcRenderer.invoke('app:open-url', url),

  /** 终止指定 PID 的进程 */
  killProcess: (pid: number): Promise<{ success: boolean; error?: string }> =>
    ipcRenderer.invoke('app:kill-process', pid)
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('hub', api)
  } catch (error) {
    console.error('preload expose failed:', error)
  }
} else {
  // @ts-ignore 兜底
  window.hub = api
}

export type HubApi = typeof api
