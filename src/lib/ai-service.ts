import { API_ENDPOINTS } from './config'
import type { Message } from '@/store/chat-store'
import { MODEL_PULL_NAMES } from '@/lib/model-service'
import { useSettingsStore } from '@/store/settings-store'

interface ModelParams {
  temperature: number
  maxTokens: number
}

interface ServiceStatus {
  available: boolean
  error?: string
}

// Helper function to format debug info
function formatDebugInfo(info: any): string {
  return JSON.stringify(info, null, 2)
    .replace(/[{}"]/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')
}

export async function checkOllamaStatus(): Promise<ServiceStatus> {
  try {
    console.log('Checking Ollama status at:', `${API_ENDPOINTS.ollama}/api/version`)
    const response = await fetch(`${API_ENDPOINTS.ollama}/api/version`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      console.error('Ollama response not OK:', response.status, response.statusText)
      return { 
        available: false, 
        error: `Ollama service returned error ${response.status}: ${response.statusText}` 
      }
    }

    const data = await response.json()
    console.log('Ollama version:', data)
    return { available: true }
  } catch (error) {
    console.error('Error checking Ollama status:', error)
    return {
      available: false,
      error: error instanceof Error 
        ? `Could not connect to Ollama: ${error.message}`
        : 'Could not connect to Ollama. Make sure it is installed and running: "ollama serve"',
    }
  }
}

export async function checkDeepSeekStatus(): Promise<ServiceStatus> {
  try {
    const response = await fetch(`${API_ENDPOINTS.deepseek}/health`)
    if (!response.ok) {
      return { available: false, error: 'DeepSeek service returned an error' }
    }
    return { available: true }
  } catch (error) {
    return {
      available: false,
      error: 'Could not connect to DeepSeek. Make sure it is installed and running locally.',
    }
  }
}

export async function generateOllamaResponse(
  messages: Message[],
  modelId: string,
  params: ModelParams,
  imageData?: { content: string; type: string },
  onStream?: (text: string) => void
) {
  const settings = useSettingsStore.getState()
  const debugMode = settings.advancedSettings.debugMode
  const debugInfo: string[] = []

  if (debugMode) {
    debugInfo.push('Debug Mode Active')
    debugInfo.push(`Model: ${modelId}`)
    debugInfo.push(`Temperature: ${params.temperature}`)
    debugInfo.push(`Max Tokens: ${params.maxTokens}`)
    debugInfo.push(`Context Window: ${settings.advancedSettings.contextWindow}`)
    debugInfo.push(`Streaming: ${settings.advancedSettings.streamingEnabled}`)
    if (imageData) {
      debugInfo.push('Image Input: Yes')
      debugInfo.push(`Image Type: ${imageData.type}`)
    }
  }

  const status = await checkOllamaStatus()
  if (!status.available) {
    throw new Error(status.error)
  }

  try {
    // Format conversation history
    const formattedMessages = formatMessagesForOllama(messages)
    const fullPrompt = formattedMessages

    const response = await fetch(`${API_ENDPOINTS.ollama}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_PULL_NAMES[modelId] || modelId,
        prompt: fullPrompt,
        stream: true,
        options: {
          temperature: params.temperature,
          num_predict: params.maxTokens,
        },
        images: imageData ? [imageData.content] : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      if (debugMode) {
        debugInfo.push('Error Response:')
        debugInfo.push(error)
      }
      console.error('Ollama generation error:', error)
      throw new Error(`Failed to generate response from Ollama: ${error}`)
    }

    // Handle streaming response
    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response reader')
    }

    let fullResponse = ''
    let responseMetadata = {}
    let buffer = ''
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines from the buffer
        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (!line.trim()) continue
          
          try {
            const data = JSON.parse(line)
            if (data.response) {
              fullResponse += data.response
              // Call the streaming callback if provided
              onStream?.(data.response)
            }
            if (data.done) {
              responseMetadata = {
                totalTokens: data.total_duration,
                loadDuration: data.load_duration,
                promptEvalDuration: data.prompt_eval_duration,
                evalDuration: data.eval_duration
              }
            }
          } catch (e) {
            console.warn('Failed to parse streaming response line:', line, e)
          }
        }
      }

      // Process any remaining data in the buffer
      if (buffer.trim()) {
        try {
          const data = JSON.parse(buffer)
          if (data.response) {
            fullResponse += data.response
          }
          if (data.done) {
            responseMetadata = {
              totalTokens: data.total_duration,
              loadDuration: data.load_duration,
              promptEvalDuration: data.prompt_eval_duration,
              evalDuration: data.eval_duration
            }
          }
        } catch (e) {
          console.warn('Failed to parse final buffer:', buffer, e)
        }
      }

      // Flush the decoder
      const remaining = decoder.decode()
      if (remaining) buffer += remaining
    } finally {
      reader.releaseLock()
    }

    if (debugMode) {
      debugInfo.push('Response Stats:')
      debugInfo.push(formatDebugInfo(responseMetadata))
      console.log('Ollama response data:', responseMetadata)
    }
    
    if (!fullResponse) {
      throw new Error('Invalid response format from Ollama')
    }

    // Clean up the response
    let cleanResponse = fullResponse.trim()
    
    // Remove any "Assistant:" prefix if present
    cleanResponse = cleanResponse.replace(/^Assistant:\s*/i, '')
    
    // Add thinking section with debug info if enabled
    const thought = debugMode
      ? `<think>Debug Information:\n${debugInfo.join('\n')}\n\nProcessing your request...</think>\n\n`
      : imageData 
        ? `<think>Analyzing the provided image and formulating a response based on visual content.</think>\n\n`
        : `<think>Processing your question to provide a direct and accurate answer.</think>\n\n`

    return thought + cleanResponse
  } catch (error) {
    console.error('Error generating Ollama response:', error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to communicate with Ollama')
  }
}

export async function generateDeepSeekResponse(
  messages: Message[],
  params: ModelParams
) {
  const status = await checkDeepSeekStatus()
  if (!status.available) {
    throw new Error(status.error)
  }

  try {
    const response = await fetch(`${API_ENDPOINTS.deepseek}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: formatMessagesForDeepSeek(messages),
        temperature: params.temperature,
        max_tokens: params.maxTokens,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to generate response from DeepSeek: ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Failed to communicate with DeepSeek')
  }
}

function formatMessagesForOllama(messages: Message[]): string {
  // Get enabled model knowledge
  const settings = useSettingsStore.getState();
  const enabledKnowledge = settings.advancedSettings.modelKnowledge
    .filter(k => k.enabled)
    .map(k => k.content)
    .join('\n');

  // Format the conversation history
  const history = messages
    .map((msg) => {
      if (msg.role === 'user') {
        return `Human: ${msg.content}`
      } else if (msg.role === 'assistant') {
        // Remove thinking sections from previous responses in the history
        const cleanContent = msg.content.replace(/<think>[^]*?<\/think>/, '').trim()
        return `Assistant: ${cleanContent}`
      }
      return ''
    })
    .filter(Boolean)
    .join('\n')
  
  // Add instructions for the model to show its thinking process
  const systemPrompt = `You are a helpful AI assistant. Be direct and concise in your responses. Stay focused on the user's questions and provide accurate, relevant answers.

${enabledKnowledge ? `Important context about me:\n${enabledKnowledge}\n` : ''}

Before responding, briefly show your thinking process inside <think></think> tags.

For example:
Human: What's 2+2?
Assistant: <think>This is a basic arithmetic question. The sum of 2 and 2 is 4.</think>
4`

  // Add a clear separator and prompt for the assistant's response
  return `${systemPrompt}\n\n${history}\n\nAssistant:`
}

function formatMessagesForDeepSeek(messages: Message[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))
} 