import { API_ENDPOINTS } from './config'
import { MODEL_PULL_NAMES } from '@mata/provider-core'

export { MODEL_PULL_NAMES }

export interface ModelInfo {
  name: string
  status: 'not_installed' | 'installed' | 'running' | 'error'
  error?: string
  progress?: number
  size?: string  // Size in GB
  parameterSize?: string
  quantization?: string
  family?: string
}

export async function getOllamaModelStatus(modelId: string): Promise<ModelInfo> {
  try {
    const pullName = MODEL_PULL_NAMES[modelId]
    if (!pullName) {
      return {
        name: modelId,
        status: 'error',
        error: `Unknown model: ${modelId}`,
      }
    }

    // Check if Ollama is running
    const versionResponse = await fetch(`${API_ENDPOINTS.ollama}/api/version`)
    if (!versionResponse.ok) {
      return {
        name: modelId,
        status: 'error',
        error: 'Ollama service is not running. Please start it with "ollama serve"',
      }
    }

    // List installed models
    const listResponse = await fetch(`${API_ENDPOINTS.ollama}/api/tags`)
    if (!listResponse.ok) {
      return {
        name: modelId,
        status: 'not_installed',
      }
    }

    const data = await listResponse.json()
    const installedModel = data.models?.find((model: { name: string; size?: number; details?: Record<string, string> }) =>
      model.name === pullName
    )

    if (installedModel) {
      // Convert size from bytes to GB and format with 2 decimal places
      const sizeInGB = installedModel.size ? (installedModel.size / (1024 * 1024 * 1024)).toFixed(2) + ' GB' : undefined

      return {
        name: modelId,
        status: 'running',
        size: sizeInGB,
        parameterSize: installedModel.details?.parameter_size || undefined,
        quantization: installedModel.details?.quantization_level || undefined,
        family: installedModel.details?.family || undefined,
      }
    }

    return {
      name: modelId,
      status: 'not_installed',
    }
  } catch (error) {
    console.error('Error checking Ollama model status:', error)
    return {
      name: modelId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Could not connect to Ollama service',
    }
  }
}

export async function installOllamaModel(
  modelId: string,
  onProgress?: (progress: number) => void
): Promise<ModelInfo> {
  const pullName = MODEL_PULL_NAMES[modelId]
  if (!pullName) {
    return {
      name: modelId,
      status: 'error',
      error: `Unknown model: ${modelId}`,
    }
  }
  return pullModel(modelId, pullName, onProgress)
}

/**
 * Installs any model tag Ollama's library has, bypassing Mata's own curated
 * catalog entirely — the catalog can only ever cover a fraction of what
 * Ollama actually hosts, so this is the real "full access" path.
 */
export async function installOllamaModelByName(
  pullName: string,
  onProgress?: (progress: number) => void
): Promise<ModelInfo> {
  return pullModel(pullName, pullName, onProgress)
}

async function pullModel(
  displayName: string,
  pullName: string,
  onProgress?: (progress: number) => void
): Promise<ModelInfo> {
  try {
    console.log(`Installing model ${displayName} using pull name ${pullName}...`)
    const response = await fetch(`${API_ENDPOINTS.ollama}/api/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: pullName,
        stream: true,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Model installation error:', error)
      throw new Error(`Failed to install model: ${error}`)
    }

    // Read the streamed response to track progress
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    let totalBytes = 0
    let downloadedBytes = 0
    let lastProgress = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = new TextDecoder().decode(value)
      const lines = text.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const data = JSON.parse(line)
          if (data.total) {
            totalBytes = parseInt(data.total)
          }
          if (data.completed) {
            downloadedBytes = parseInt(data.completed)
            const progress = Math.round((downloadedBytes / totalBytes) * 100)
            if (progress !== lastProgress) {
              lastProgress = progress
              onProgress?.(progress)
            }
          }
          if (data.status === 'success') {
            onProgress?.(100)
          }
        } catch (e) {
          console.warn('Failed to parse progress data:', e)
        }
      }
    }

    return {
      name: displayName,
      status: 'running',
      progress: 100,
    }
  } catch (error) {
    console.error('Error installing model:', error)
    return {
      name: displayName,
      status: 'error',
      error: error instanceof Error
        ? `Installation failed: ${error.message}. Try running "ollama pull ${pullName}" manually.`
        : 'Failed to install model',
    }
  }
}

export async function deleteOllamaModel(modelId: string): Promise<ModelInfo> {
  try {
    const pullName = MODEL_PULL_NAMES[modelId]
    if (!pullName) {
      throw new Error(`Unknown model: ${modelId}`)
    }

    console.log(`Deleting model ${modelId} (${pullName})...`)
    
    // First try the new API endpoint
    const response = await fetch(`${API_ENDPOINTS.ollama}/api/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: pullName,
      }),
    })

    if (!response.ok) {
      // If that fails, try the older endpoint
      const oldResponse = await fetch(`${API_ENDPOINTS.ollama}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pullName,
        }),
      })

      if (!oldResponse.ok) {
        const error = await oldResponse.text()
        console.error('Model deletion error:', error)
        throw new Error(`Failed to delete model: ${error}`)
      }
    }

    return {
      name: modelId,
      status: 'not_installed',
    }
  } catch (error) {
    console.error('Error deleting model:', error)
    return {
      name: modelId,
      status: 'error',
      error: error instanceof Error 
        ? `Deletion failed: ${error.message}. Try running "ollama rm ${MODEL_PULL_NAMES[modelId]}" manually.`
        : 'Failed to delete model',
    }
  }
}

export async function startOllamaModel(modelId: string): Promise<ModelInfo> {
  try {
    const pullName = MODEL_PULL_NAMES[modelId]
    if (!pullName) {
      throw new Error(`Unknown model: ${modelId}`)
    }

    // For Ollama, we don't actually need to "start" the model - it's ready when installed
    return {
      name: modelId,
      status: 'running',
    }
  } catch (error) {
    return {
      name: modelId,
      status: 'error',
      error: 'Failed to start model',
    }
  }
}
 