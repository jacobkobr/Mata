import { API_ENDPOINTS } from './config'
import type { Message } from '@/store/chat-store'
import { MODEL_PULL_NAMES } from '@/lib/model-service'

interface ModelParams {
  temperature: number
  maxTokens: number
}

interface ServiceStatus {
  available: boolean
  error?: string
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
  imageData?: { content: string; type: string }
) {
  const status = await checkOllamaStatus()
  if (!status.available) {
    throw new Error(status.error)
  }

  try {
    const pullName = MODEL_PULL_NAMES[modelId]
    if (!pullName) {
      throw new Error(`Unknown model: ${modelId}`)
    }

    console.log('Generating Ollama response for model:', pullName)
    
    let requestBody: any = {
      model: pullName,
      stream: false,
      options: {
        temperature: params.temperature,
        num_predict: params.maxTokens,
      },
    }

    // Handle image input for vision model
    if (imageData && pullName === 'llama3.2-vision:11b') {
      requestBody = {
        model: pullName,
        prompt: messages[messages.length - 1].content,
        images: [imageData.content],
        stream: false,
        options: {
          temperature: params.temperature,
          num_predict: params.maxTokens,
        },
        system: "You are a helpful vision assistant. Analyze the image and provide detailed, accurate descriptions and answers to questions about the image content."
      }
    } else {
      requestBody.prompt = formatMessagesForOllama(messages)
    }

    console.log('Sending request to Ollama:', {
      ...requestBody,
      images: requestBody.images ? [`${requestBody.images[0].slice(0, 50)}...`] : undefined
    })

    const response = await fetch(`${API_ENDPOINTS.ollama}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Ollama generation error:', error)
      throw new Error(`Failed to generate response from Ollama: ${error}`)
    }

    const data = await response.json()
    console.log('Ollama response data:', data)
    
    if (!data.response) {
      throw new Error('Invalid response format from Ollama')
    }

    // Clean up the response
    let cleanResponse = data.response.trim()
    
    // Remove any "Assistant:" prefix if present
    cleanResponse = cleanResponse.replace(/^Assistant:\s*/i, '')
    
    // Add thinking section if not present
    if (!cleanResponse.includes('<think>')) {
      const thought = imageData 
        ? `<think>Analyzing the provided image and formulating a response based on visual content.</think>\n\n`
        : `<think>Processing your question to provide a direct and accurate answer.</think>\n\n`
      cleanResponse = thought + cleanResponse
    }

    return cleanResponse
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

For example:
Human: What's 2+2?
Assistant: 4

Before responding, briefly show your thinking process inside <think></think> tags.`

  // Add a clear separator and prompt for the assistant's response
  return `${systemPrompt}\n\n${history}\n\nAssistant:`
}

function formatMessagesForDeepSeek(messages: Message[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }))
} 