import { API_ENDPOINTS } from './config'

export interface ModelInfo {
  name: string
  status: 'not_installed' | 'installed' | 'running' | 'error'
  error?: string
  progress?: number
}

// Add model name mapping for Ollama
export const MODEL_PULL_NAMES: Record<string, string> = {
  'llama2-7b': 'llama2:7b',
  'llama2-13b': 'llama2:13b',
  'codellama-7b': 'codellama:7b',
  'codellama-13b': 'codellama:13b',
  'llama-vision': 'llama3.2-vision:11b',
  'deepseek-1.5b': 'deepseek-r1:1.5b',
  'deepseek-7b': 'deepseek-r1:7b',
  'deepseek-8b': 'deepseek-r1:8b',
  'deepseek-14b': 'deepseek-r1:14b',
  'deepseek-32b': 'deepseek-r1:32b',
  'mistral-7b': 'mistral:latest',
  'phi-2': 'phi:latest',
  'gemma-2b': 'gemma:2b',
  'gemma-7b': 'gemma:7b',
  'qwen-1.5b': 'qwen:1.5b',
  'qwen-7b': 'qwen:7b',
  'qwen-14b': 'qwen:14b',
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
    const isInstalled = data.models?.some((model: { name: string }) => {
      // Only do exact match to prevent false positives
      return model.name === pullName;
    })

    return {
      name: modelId,
      status: isInstalled ? 'running' : 'not_installed',
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
  try {
    const pullName = MODEL_PULL_NAMES[modelId]
    if (!pullName) {
      throw new Error(`Unknown model: ${modelId}`)
    }

    console.log(`Installing model ${modelId} using pull name ${pullName}...`)
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
      name: modelId,
      status: 'running',
      progress: 100,
    }
  } catch (error) {
    console.error('Error installing model:', error)
    return {
      name: modelId,
      status: 'error',
      error: error instanceof Error 
        ? `Installation failed: ${error.message}. Try running "ollama pull ${MODEL_PULL_NAMES[modelId]}" manually.`
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

export async function getDeepSeekStatus(): Promise<ModelInfo> {
  try {
    const response = await fetch(`${API_ENDPOINTS.deepseek}/health`)
    if (!response.ok) {
      return {
        name: 'deepseek-coder',
        status: 'error',
        error: 'DeepSeek service is not running',
      }
    }

    return {
      name: 'deepseek-coder',
      status: 'running',
    }
  } catch (error) {
    return {
      name: 'deepseek-coder',
      status: 'error',
      error: 'Could not connect to DeepSeek service',
    }
  }
} 