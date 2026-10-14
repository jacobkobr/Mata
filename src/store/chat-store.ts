import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { createOllamaProvider, createChatGPTProvider, MODEL_PULL_NAMES, type Provider } from '@mata/provider-core'
import { AI_MODELS } from '@/lib/config'
import { useSettingsStore } from './settings-store'
import * as chatService from '@/lib/chat-service'
import type { DBChat, DBMessage } from '@/lib/types'
import { indexMessage, clearChatIndex, clearAllIndices, searchMessages } from '@/lib/indexing-service'
import { toast } from '@/components/ui/use-toast'

const ollamaProvider = createOllamaProvider()

// ChatGPT's provider needs the main-process IPC bridge, which only exists in Electron.
const chatGPTProvider: Provider | null =
  typeof window !== 'undefined' && window.electron ? createChatGPTProvider(window.electron.chatgpt) : null

export interface Message {
  id: string
  chatId: string
  role: 'user' | 'assistant' | 'error'
  content: string
  timestamp: number
  modelId?: string
  /** Which backend actually answered — mainly useful when activeProvider is 'auto'. */
  provider?: 'ollama' | 'chatgpt'
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
  searchResults: { message: Message; score: number }[]
  loadChats: () => Promise<void>
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  sendMessage: (content: string, imageData?: { content: string; type: string }) => Promise<void>
  stopGeneration: () => void
  regenerateLastResponse: () => Promise<void>
  editMessage: (messageId: string, newContent: string) => Promise<void>
  deleteMessage: (messageId: string) => Promise<void>
  clearMessages: () => void
  clearError: () => void
  startNewChat: () => Promise<string>
  switchChat: (chatId: string) => void
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  clearAllChats: () => Promise<void>
  searchChatHistory: (query: string) => void
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

export const useChatStore = create<ChatState>()((set, get) => {
  // Not persisted state — a generation in flight and the controller that can
  // cancel it. Lives outside the zustand object since it's plumbing, not data
  // the UI reads directly.
  let abortController: AbortController | null = null

  /**
   * Streams a reply into the given (already-created) assistant message and
   * persists the final result. Shared by sendMessage, regenerateLastResponse,
   * and editMessage so the provider-selection/error-handling logic lives in
   * exactly one place.
   */
  async function generateReply(
    chatId: string,
    contextMessages: Message[],
    assistantMessageId: string,
    imageData?: { content: string; type: string }
  ): Promise<void> {
    const settings = useSettingsStore.getState()

    const knowledgeContext = settings.advancedSettings.modelKnowledge
      .filter(k => k.enabled)
      .map(k => k.content)
      .join('\n')

    let provider: Provider
    let modelId: string

    if (imageData) {
      // Sign in with ChatGPT can't accept images at all in this SDK version
      // (confirmed by reading its request validation — not a Mata limitation
      // that can be worked around client-side). A local vision model is the
      // only thing that can actually analyze an attached image right now, so
      // route there regardless of which provider is otherwise selected.
      const ollamaStatus = await ollamaProvider.checkStatus()
      const visionPullName = MODEL_PULL_NAMES['llama-vision']
      const installed = ollamaStatus.available ? await ollamaProvider.listModels() : []
      const hasVisionModel = !!visionPullName && installed.some(m => m.id === visionPullName)

      if (!hasVisionModel) {
        throw new Error(
          "Analyzing images needs a local vision model — Sign in with ChatGPT can't accept image attachments in this version of the API. Pull Llama Vision (or another vision model) from the Models tab, then try again."
        )
      }

      provider = ollamaProvider
      modelId = 'llama-vision'

      if (settings.activeProvider !== 'ollama') {
        toast({
          title: 'Used a local vision model for this image',
          description: "ChatGPT can't accept image attachments through Sign in with ChatGPT yet, so this one went to Llama Vision instead.",
        })
      }
    } else if (settings.activeProvider === 'chatgpt') {
      if (!chatGPTProvider) {
        throw new Error('Sign in with ChatGPT requires the Mata desktop app.')
      }
      if (!settings.chatGPTModelSlug) {
        throw new Error('Select a ChatGPT model in Settings before sending a message.')
      }
      provider = chatGPTProvider
      modelId = settings.chatGPTModelSlug
    } else if (settings.activeProvider === 'auto') {
      const resolved = await resolveAutoProvider(settings)
      if (!resolved) {
        throw new Error(
          "Auto mode couldn't find a usable model — make sure Ollama is running with a model installed, or sign in with ChatGPT and enable plan sharing."
        )
      }
      provider = resolved.provider
      modelId = resolved.modelId
    } else {
      const modelConfig = AI_MODELS.find(m => m.id === settings.selectedModel)
      if (!modelConfig) {
        throw new Error('Selected model not found in configuration')
      }
      provider = ollamaProvider
      modelId = settings.selectedModel
    }

    if (settings.advancedSettings.debugMode) {
      console.log('[Mata debug] sending message', {
        provider: provider.id,
        model: modelId,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        messageCount: contextMessages.length,
        hasImage: !!imageData,
        knowledgeContext: knowledgeContext ? `${knowledgeContext.length} chars` : undefined,
      })
    }

    // Stamp which backend is actually handling this turn onto the in-memory
    // message right away, so the UI reflects it as it streams — not just
    // after persisting (useful mainly for Auto mode, where this is dynamic).
    const resolvedProvider = provider.id as 'ollama' | 'chatgpt'
    set((state) => ({
      messages: state.messages.map(msg =>
        msg.id === assistantMessageId ? { ...msg, modelId, provider: resolvedProvider } : msg
      ),
    }))

    abortController = new AbortController()
    const { signal } = abortController

    let response = ''
    try {
      for await (const chunk of provider.generate({
        model: modelId,
        messages: contextMessages.map(m => ({ role: m.role, content: m.content })),
        images: imageData,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        knowledgeContext: knowledgeContext || undefined,
        signal,
      })) {
        set((state) => ({
          messages: state.messages.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, content: chunk.done ? chunk.text : msg.content + chunk.text }
              : msg
          ),
        }))
        if (chunk.done) {
          response = chunk.text
        }
      }
    } catch (error) {
      if (signal.aborted) {
        // User hit Stop — keep whatever streamed so far instead of discarding
        // it as a failure.
        const partial = get().messages.find(m => m.id === assistantMessageId)?.content ?? ''
        const stoppedMessage = {
          role: 'assistant' as const,
          content: partial,
          chatId,
          id: assistantMessageId,
          timestamp: Date.now(),
          modelId,
          provider: resolvedProvider,
        }
        await chatService.addMessage(stoppedMessage)
        await indexMessage(stoppedMessage)
        return
      }
      throw error
    }

    const finalMessage = {
      role: 'assistant' as const,
      content: response,
      chatId,
      id: assistantMessageId,
      timestamp: Date.now(),
      modelId,
      provider: resolvedProvider,
    }
    await chatService.addMessage(finalMessage)
    await indexMessage(finalMessage)
  }

  /**
   * Auto mode (text turns only — image turns are resolved earlier and never
   * reach here): prefer the locally selected Ollama model, but only if Ollama
   * is actually running AND that model is actually pulled — otherwise fall
   * back to ChatGPT, when signed in with sharing enabled.
   */
  async function resolveAutoProvider(
    settings: ReturnType<typeof useSettingsStore.getState>
  ): Promise<{ provider: Provider; modelId: string } | null> {
    const ollamaStatus = await ollamaProvider.checkStatus()
    if (ollamaStatus.available) {
      const installed = await ollamaProvider.listModels()
      const installedTags = new Set(installed.map(m => m.id))
      const pullName = MODEL_PULL_NAMES[settings.selectedModel]
      if (pullName && installedTags.has(pullName)) {
        return { provider: ollamaProvider, modelId: settings.selectedModel }
      }
    }

    if (chatGPTProvider && settings.chatGPTModelSlug) {
      const chatGPTStatus = await chatGPTProvider.checkStatus()
      if (chatGPTStatus.available) {
        return { provider: chatGPTProvider, modelId: settings.chatGPTModelSlug }
      }
    }

    return null
  }

  return {
  currentChatId: null,
  chatHistories: {},
  messages: [],
  isLoading: false,
  error: null,
  searchResults: [],

  loadChats: async () => {
    try {
      const chats = await chatService.getAllChats()
      const chatHistories: Record<string, ChatHistory> = {}
      
      for (const chat of chats) {
        const dbMessages = await chatService.getChatMessages(chat.id)
        const messages = dbMessages.map(convertDBMessageToMessage)
        chatHistories[chat.id] = {
          ...chat,
          messages,
        }
        // Index all messages
        for (const message of dbMessages) {
          await indexMessage(message)
        }
      }

      set({ chatHistories })
    } catch (error) {
      console.error('Failed to load chats:', error)
    }
  },

  startNewChat: async () => {
    const settings = useSettingsStore.getState()
    const chatId = uuidv4()
    const now = Date.now()

    const newChat: ChatHistory = {
      id: chatId,
      title: 'New Chat',
      messages: [],
      lastUpdated: now,
      modelId: settings.selectedModel,
      createdAt: now,
    }

    await chatService.createChat(newChat)

    set((state) => ({
      currentChatId: chatId,
      chatHistories: {
        ...state.chatHistories,
        [chatId]: newChat,
      },
      messages: [],
    }))

    return chatId
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
      clearChatIndex(chatId)
      
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
      id: uuidv4(),
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
        await indexMessage(dbMessage)
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
    if (get().isLoading) return
    try {
      const currentChatId = get().currentChatId ?? (await get().startNewChat())

      const userMessage: Message = {
        role: 'user',
        content,
        id: uuidv4(),
        timestamp: Date.now(),
        chatId: currentChatId
      }

      set((state) => ({
        messages: [...state.messages, userMessage],
        isLoading: true,
        error: null,
      }))

      // Save user message to storage
      await chatService.addMessage({ ...userMessage })
      await indexMessage({ ...userMessage })

      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        id: uuidv4(),
        timestamp: Date.now(),
        chatId: currentChatId
      }
      set((state) => ({ messages: [...state.messages, assistantMessage] }))

      try {
        const contextMessages = get().messages.filter(m => m.id !== assistantMessage.id)
        await generateReply(currentChatId, contextMessages, assistantMessage.id, imageData)
      } catch (error) {
        // A dangling empty bubble looks broken — drop it and show a real error instead.
        set((state) => ({ messages: state.messages.filter(m => m.id !== assistantMessage.id) }))
        if (error instanceof Error && error.message.includes('Could not connect')) {
          get().addMessage({
            role: 'error',
            content: INSTALLATION_INSTRUCTIONS.ollama,
            chatId: currentChatId
          })
        } else {
          get().addMessage({
            role: 'error',
            content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
            chatId: currentChatId
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
      abortController = null
      set({ isLoading: false })
    }
  },

  stopGeneration: () => {
    abortController?.abort()
  },

  regenerateLastResponse: async () => {
    if (get().isLoading) return
    const chatId = get().currentChatId
    if (!chatId) return

    const messages = get().messages
    const reverseIndex = [...messages].reverse().findIndex(m => m.role === 'assistant')
    if (reverseIndex === -1) return
    const removeIndex = messages.length - 1 - reverseIndex
    const oldMessage = messages[removeIndex]
    const contextMessages = messages.slice(0, removeIndex)

    try {
      await chatService.deleteMessage(oldMessage.id)
    } catch (error) {
      console.error('Failed to delete message for regeneration:', error)
    }

    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: uuidv4(),
      timestamp: Date.now(),
      chatId,
    }
    set({ messages: [...contextMessages, newAssistantMessage], isLoading: true, error: null })

    try {
      await generateReply(chatId, contextMessages, newAssistantMessage.id)
    } catch (error) {
      console.error('Error regenerating message:', error)
      set((state) => ({ messages: state.messages.filter(m => m.id !== newAssistantMessage.id) }))
      get().addMessage({
        role: 'error',
        content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
        chatId,
      })
    } finally {
      abortController = null
      set({ isLoading: false })
    }
  },

  editMessage: async (messageId: string, newContent: string) => {
    if (get().isLoading) return
    const chatId = get().currentChatId
    if (!chatId) return

    const messages = get().messages
    const index = messages.findIndex(m => m.id === messageId)
    if (index === -1 || messages[index].role !== 'user') return

    const keptBefore = messages.slice(0, index)
    const toRemoveAfter = messages.slice(index + 1)
    const editedMessage: Message = { ...messages[index], content: newContent, timestamp: Date.now() }

    for (const m of toRemoveAfter) {
      try {
        await chatService.deleteMessage(m.id)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }

    try {
      await chatService.updateMessage({ ...editedMessage, chatId })
    } catch (error) {
      console.error('Failed to save edited message:', error)
    }

    clearChatIndex(chatId)
    for (const m of [...keptBefore, editedMessage]) {
      await indexMessage({ ...m, chatId })
    }

    const contextMessages = [...keptBefore, editedMessage]
    const newAssistantMessage: Message = {
      role: 'assistant',
      content: '',
      id: uuidv4(),
      timestamp: Date.now(),
      chatId,
    }
    set({ messages: [...contextMessages, newAssistantMessage], isLoading: true, error: null })

    try {
      await generateReply(chatId, contextMessages, newAssistantMessage.id)
    } catch (error) {
      console.error('Error generating reply for edited message:', error)
      set((state) => ({ messages: state.messages.filter(m => m.id !== newAssistantMessage.id) }))
      get().addMessage({
        role: 'error',
        content: error instanceof Error ? error.message : 'An error occurred while processing your request.',
        chatId,
      })
    } finally {
      abortController = null
      set({ isLoading: false })
    }
  },

  deleteMessage: async (messageId: string) => {
    const chatId = get().currentChatId
    if (!chatId) return

    try {
      await chatService.deleteMessage(messageId)
    } catch (error) {
      console.error('Failed to delete message:', error)
    }

    set((state) => {
      const newMessages = state.messages.filter(m => m.id !== messageId)
      const chatHistory = state.chatHistories[chatId]
      return {
        messages: newMessages,
        chatHistories: chatHistory
          ? { ...state.chatHistories, [chatId]: { ...chatHistory, messages: newMessages } }
          : state.chatHistories,
      }
    })

    clearChatIndex(chatId)
    for (const m of get().messages) {
      await indexMessage({ ...m, chatId })
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

      // Clear the index
      clearAllIndices()

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

  searchChatHistory: (query: string) => {
    const results = searchMessages(query)
    set({ searchResults: results })
  },
  }
}) 