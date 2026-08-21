import type { DiscoveredApp, ScanProgress } from '../shared/types'

export interface HubApi {
  discover: () => Promise<DiscoveredApp[]>
  onProgress: (callback: (progress: ScanProgress) => void) => () => void
  openUrl: (url: string) => Promise<boolean>
  killProcess: (pid: number) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    hub: HubApi
  }
}
