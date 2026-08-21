import { useState, useCallback, useEffect } from 'react'
import type { DiscoveredApp, ScanProgress } from '@shared/types'

type Phase = 'idle' | 'scanning' | 'done' | 'error'

export interface UseDiscoveredApps {
  apps: DiscoveredApp[]
  phase: Phase
  progress: ScanProgress | null
  error: string | null
  scan: () => Promise<void>
}

export function useDiscoveredApps(): UseDiscoveredApps {
  const [apps, setApps] = useState<DiscoveredApp[]>([])
  const [phase, setPhase] = useState<Phase>('idle')
  const [progress, setProgress] = useState<ScanProgress | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = window.hub.onProgress((p) => setProgress(p))
    return unsubscribe
  }, [])

  const scan = useCallback(async () => {
    setPhase('scanning')
    setError(null)
    setProgress({ phase: 'scanning-ports', current: 0, total: 0 })
    try {
      const result = await window.hub.discover()
      setApps(result)
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [])

  return { apps, phase, progress, error, scan }
}
