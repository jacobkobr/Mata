import { useEffect, useState } from 'react'
import { AI_MODELS } from '@/lib/config'
import { getOllamaModelStatus } from '@/lib/model-service'

export function useInstalledOllamaModels() {
  const [installedModels, setInstalledModels] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      setIsLoading(true)
      const installed: string[] = []
      for (const model of AI_MODELS) {
        const status = await getOllamaModelStatus(model.id)
        if (status.status === 'running' || status.status === 'installed') {
          installed.push(model.id)
        }
      }
      if (!cancelled) {
        setInstalledModels(installed)
        setIsLoading(false)
      }
    }

    check()
    return () => { cancelled = true }
  }, [])

  return { installedModels, isLoading }
}
