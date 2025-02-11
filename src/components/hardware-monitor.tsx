import { useEffect, useState } from 'react'
import { Cpu, HardDrive, MonitorCheck, Check, AlertCircle, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SystemInfo, ResourceUsage } from '@/types/electron'

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(2)} GB`
}

function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`
}

export function HardwareMonitor() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [resourceUsage, setResourceUsage] = useState<ResourceUsage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const electron = window?.electron
    if (!electron) {
      setError('Electron API not available')
      setIsLoading(false)
      return
    }

    let mounted = true

    const getSystemInfo = async () => {
      try {
        setIsLoading(true)
        const info = await electron.send('get-system-info')
        if (!mounted) return
        
        if (info && typeof info === 'object') {
          setSystemInfo(info as SystemInfo)
          setError(null)
        } else {
          setError('Invalid system information received')
        }
      } catch (err) {
        if (!mounted) return
        console.error('Error getting system info:', err)
        setError('Failed to get system information')
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    const handleSystemInfo = (info: SystemInfo) => {
      if (!mounted) return
      setSystemInfo(info)
      setError(null)
    }

    const handleResourceUsage = (usage: ResourceUsage) => {
      if (!mounted) return
      setResourceUsage(usage)
    }

    // Initial setup
    getSystemInfo()

    // Start monitoring only if we successfully got system info
    const startMonitoring = async () => {
      try {
        await electron.send('start-monitoring')
      } catch (err) {
        console.error('Error starting monitoring:', err)
        if (mounted) {
          setError('Failed to start system monitoring')
        }
      }
    }

    startMonitoring()

    // Subscribe to updates
    electron.receive('system-info', handleSystemInfo)
    electron.receive('resource-usage', handleResourceUsage)

    // Cleanup
    return () => {
      mounted = false
      electron.send('stop-monitoring').catch(console.error)
      electron.removeListener('system-info', handleSystemInfo)
      electron.removeListener('resource-usage', handleResourceUsage)
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  if (!systemInfo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">No system information available</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">System Resources</h1>

      {/* CPU Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Cpu className="h-5 w-5" />
          CPU
        </h2>
        <div className="grid gap-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium">{systemInfo.cpu.brand}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Architecture</span>
            <span className="font-medium">{systemInfo.cpu.architecture}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Cores</span>
            <span className="font-medium">
              {systemInfo.cpu.physicalCores} Physical / {systemInfo.cpu.cores} Logical
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Base Speed</span>
            <span className="font-medium">{systemInfo.cpu.speed.toFixed(2)} GHz</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">
                {resourceUsage ? formatPercentage(resourceUsage.cpu.load) : '0%'}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: resourceUsage ? `${resourceUsage.cpu.load}%` : '0%'
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-sm text-muted-foreground">Instruction Set Extensions</span>
            <div className="flex gap-2">
              {Object.entries(systemInfo.cpu.instructions).map(([key, supported]) => (
                <div
                  key={key}
                  className={cn(
                    "px-2 py-1 rounded text-xs font-medium",
                    supported
                      ? "bg-green-500/10 text-green-500"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {key.toUpperCase()}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Memory Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <HardDrive className="h-5 w-5" />
          Memory
        </h2>
        <div className="grid gap-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Total RAM</span>
            <span className="font-medium">{formatBytes(systemInfo.memory.total)}</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Memory Usage</span>
              <span className="font-medium">
                {resourceUsage ? formatBytes(resourceUsage.memory.used) : '0 GB'} /
                {' '}{formatBytes(systemInfo.memory.total)}
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: resourceUsage
                    ? `${(resourceUsage.memory.used / systemInfo.memory.total) * 100}%`
                    : '0%'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* GPU Section */}
      {systemInfo.gpu && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MonitorCheck className="h-5 w-5" />
            GPU
          </h2>
          <div className="grid gap-4 p-4 rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Model</span>
              <span className="font-medium">{systemInfo.gpu.model}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">VRAM</span>
              <span className="font-medium">{formatBytes(systemInfo.gpu.vram * 1024 * 1024)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">CUDA Support</span>
              <div className="flex items-center gap-1 text-green-500">
                {systemInfo.gpu.cuda ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Available</span>
                  </>
                ) : (
                  <span className="text-destructive">Not Available</span>
                )}
              </div>
            </div>
            {resourceUsage?.gpu && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">GPU Usage</span>
                    <span className="font-medium">
                      {formatPercentage(resourceUsage.gpu.load)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${resourceUsage.gpu.load}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">VRAM Usage</span>
                    <span className="font-medium">
                      {formatBytes(resourceUsage.gpu.memoryUsed * 1024 * 1024)} /
                      {' '}{formatBytes(resourceUsage.gpu.memoryTotal * 1024 * 1024)}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${(resourceUsage.gpu.memoryUsed / resourceUsage.gpu.memoryTotal) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 