import { useCallback } from 'react'
import { Dashboard } from '@features/dashboard/Dashboard'
import { useDiscoveredApps } from '@hooks/useDiscoveredApps'

export default function App(): JSX.Element {
  const { apps, phase, progress, error, scan } = useDiscoveredApps()

  const handleOpen = useCallback(async (url: string) => {
    await window.hub.openUrl(url)
  }, [])

  const handleKill = useCallback(async (pid: number) => {
    const result = await window.hub.killProcess(pid)
    if (result.success) {
      // kill 成功后立即重新扫描
      await scan()
    }
  }, [scan])

  return (
    <Dashboard
      apps={apps}
      phase={phase}
      progress={progress}
      error={error}
      onScan={scan}
      onOpen={handleOpen}
      onKill={handleKill}
    />
  )
}
