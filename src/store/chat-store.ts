import { create } from 'zustand'
import { generateOllamaResponse, generateDeepSeekResponse } from '@/lib/ai-service'
import { AI_MODELS } from '@/lib/config'
import { useSettingsStore } from './settings-store'
import * as chatService from '@/lib/chat-service'
import type { DBChat, DBMessage } from '@/lib/db-service'

export interface Message {
  id: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
  modelId?: string
}

interface ChatHistory {
  id: string
  title: string
  messages: Message[]
  lastUpdated: number
  modelId: string
  createdAt: number
}

interface ChatState {
  currentChatId: string | null
  chatHistories: Record<string, ChatHistory>
  messages: Message[]
  isLoading: boolean
  error: string | null
  loadChats: () => Promise<void>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  sendMessage: (content: string, imageData?: { content: string; type: string }) => Promise<void>
  clearMessages: () => void
  clearError: () => void
  startNewChat: () => void
  switchChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  clearAllChats: () => Promise<void>
}

const INSTALLATION_INSTRUCTIONS: Record<string, string> = {
  ollama: `# Ollama Installation Required

To use Ollama, follow these steps:

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Run the following commands in your terminal:
   \`\`\`bash
   ollama serve
   ollama pull llama2  # or your preferred model
   \`\`\`
3. Restart the application

Once Ollama is running, you can try sending a message again.`,
}

function convertDBMessageToMessage(dbMessage: DBMessage): Message {
  return {
    ...dbMessage,
    role: dbMessage.role as Message['role'],
  }
}

export const useChatStore = create<ChatState>()((set, get) => ({
  currentChatId: null,
  chatHistories: {},
  messages: [],
  isLoading: false,
  error: null,

  loadChats: async () => {
    try {
      const chats = await chatService.getAllChats()
      const chatHistories: Record<string, ChatHistory> = {}
      
      for (const chat of chats) {
        const dbMessages = await chatService.getChatMessages(chat.id)
        chatHistories[chat.id] = {
          ...chat,
          messages: dbMessages.map(convertDBMessageToMessage),
        }
      }

      set({ chatHistories })
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  },

  startNewChat: () => {
    const settings = useSettingsStore.getState()
    const chatId = Math.random().toString(36).substring(7)
    const now = Date.now()
    
    const newChat: ChatHistory = {
      id: chatId,
      title: 'New Chat',
      messages: [],
      lastUpdated: now,
      modelId: settings.selectedModel,
      createdAt: now,
    }

    try {
      chatService.createChat(newChat)
      
      set((state) => ({
        currentChatId: chatId,
        chatHistories: {
          ...state.chatHistories,
          [chatId]: newChat,
        },
        messages: [],
      }))
    } catch (error) {
      console.error('Failed to create new chat:', error)
    }
  },

  switchChat: (chatId: string) => {
    const chat = get().chatHistories[chatId]
    if (chat) {
      set({
        currentChatId: chatId,
        messages: chat.messages,
      })
    }
  },

  deleteChat: async (chatId: string) => {
    try {
      await chatService.deleteChat(chatId)
      
      set((state) => {
        const { [chatId]: _, ...remainingChats } = state.chatHistories
        const newState: Partial<ChatState> = {
          chatHistories: remainingChats,
        }
        
        if (state.currentChatId === chatId) {
          newState.currentChatId = null
          newState.messages = []
        }
        
        return newState as ChatState
      })
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  },

  updateChatTitle: async (chatId: string, title: string) => {
    try {
      const chat = get().chatHistories[chatId]
      if (chat) {
        const updatedChat = {
          ...chat,
          title,
          lastUpdated: Date.now(),
        }
        
        await chatService.updateChat(updatedChat)
        
        set((state) => ({
          chatHistories: {
            ...state.chatHistories,
            [chatId]: updatedChat,
          },
        }))
      }
    } catch (error) {
      console.error('Failed to update chat title:', error)
    }
  },

  addMessage: async (message) => {
    const newMessage = {
      ...message,
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      modelId: useSettingsStore.getState().selectedModel,
    }

    try {
      const { currentChatId } = get()
      if (currentChatId) {
        const dbMessage: DBMessage = {
          ...newMessage,
          chatId: currentChatId,
          role: newMessage.role,
        }
        await chatService.addMessage(dbMessage)
      }

      set((state) => {
        const newMessages = [...state.messages, newMessage]
        
        if (state.currentChatId) {
          const chatHistory = state.chatHistories[state.currentChatId]
          if (chatHistory) {
            let title = chatHistory.title
            if (title === 'New Chat' && message.role === 'user') {
              title = message.content.slice(0, 40) + (message.content.length > 40 ? '...' : '')
            }

            const updatedChat = {
              ...chatHistory,
              messages: newMessages,
              title,
              lastUpdated: Date.now(),
            }

            if (title !== chatHistory.title) {
              chatService.updateChat(updatedChat)
            }

            return {
              messages: newMessages,
              chatHistories: {
                ...state.chatHistories,
                [state.currentChatId]: updatedChat,
              },
            }
          }
        }

        return { messages: newMessages }
      })
    } catch (error) {
      console.error('Failed to add message:', error)
    }
  },

  sendMessage: async (content: string, imageData?: { content: string; type: string }) => {
    try {
      if (!get().currentChatId) {
        get().startNewChat()
      }

      const userMessage: Message = {
        role: 'user',
        content,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
      }
      
      set((state) => ({
        messages: [...state.messages, userMessage],
        isLoading: true,
        error: null,
      }))

      const settings = useSettingsStore.getState()
      const messages = get().messages
      
      let response: string
      try {
        const modelConfig = AI_MODELS.find(m => m.id === settings.selectedModel)
        if (!modelConfig) {
          throw new Error('Selected model not found in configuration')
        }

        // If image data is provided, use the vision model
        const modelId = imageData ? 'llama-vision' : settings.selectedModel

        if (modelConfig.provider === 'ollama') {
          response = await generateOllamaResponse(
            messages,
            modelId,
            {
              temperature: settings.temperature,
              maxTokens: settings.maxTokens,
            },
            imageData
          )
        } else if (modelConfig.provider === 'deepseek') {
          response = await generateDeepSeekResponse(messages, {
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          })
        } else {
          throw new Error('Unsupported model provider')
        }

        get().addMessage({
          role: 'assistant',
          content: response,
        })
      } catch (error) {
        if (error instanceof Error && error.message.includes('Could not connect')) {
          const provider = settings.selectedModel.includes('deepseek') ? 'deepseek' : 'ollama'
          get().addMessage({
            role: 'error',
            content: INSTALLATION_INSTRUCTIONS[provider] || error.message,
          })
        } else {
          get().addMessage({
            role: 'error',
            content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
          })
        }
        throw error
      }
    } catch (error) {
      console.error('Error sending message:', error)
      set({
        error: error instanceof Error ? error.message : 'An error occurred',
      })
    } finally {
      set({ isLoading: false })
    }
  },

  clearMessages: () => {
    set((state) => {
      if (state.currentChatId) {
        const { [state.currentChatId]: _, ...remainingChats } = state.chatHistories
        return {
          messages: [],
          error: null,
          currentChatId: null,
          chatHistories: remainingChats,
        }
      }
      return { messages: [], error: null }
    })
  },

  clearError: () => set({ error: null }),

  clearAllChats: async () => {
    try {
      // Delete all chats from the database
      const chats = Object.keys(get().chatHistories)
      for (const chatId of chats) {
        await chatService.deleteChat(chatId)
      }

      // Clear the store state
      set({
        chatHistories: {},
        currentChatId: null,
        messages: [],
        error: null,
      })
    } catch (error) {
      console.error('Failed to clear chat history:', error)
    }
  },
})) 