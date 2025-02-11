import type { DBChat, DBMessage } from './types'
import '@/lib/electron-types'

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electron;

// LocalStorage keys
const STORAGE_KEYS = {
  CHATS: 'mata:chats',
  MESSAGES: 'mata:messages',
  LAST_SYNC: 'mata:lastSync'
};

// Browser storage implementation
const browserStorage = {
  getAllChats: (): DBChat[] => {
    try {
      const chats = localStorage.getItem(STORAGE_KEYS.CHATS);
      return chats ? JSON.parse(chats) : [];
    } catch (error) {
      console.error('Failed to get chats from localStorage:', error);
      return [];
    }
  },

  createChat: (chat: DBChat): boolean => {
    try {
      const chats = browserStorage.getAllChats();
      chats.push(chat);
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
      return true;
    } catch (error) {
      console.error('Failed to create chat in localStorage:', error);
      return false;
    }
  },

  updateChat: (chat: DBChat): boolean => {
    try {
      const chats = browserStorage.getAllChats();
      const index = chats.findIndex(c => c.id === chat.id);
      if (index !== -1) {
        chats[index] = chat;
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update chat in localStorage:', error);
      return false;
    }
  },

  deleteChat: (chatId: string): boolean => {
    try {
      const chats = browserStorage.getAllChats();
      const filteredChats = chats.filter(chat => chat.id !== chatId);
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(filteredChats));
      
      // Also delete associated messages
      const messages = browserStorage.getAllMessages();
      const filteredMessages = messages.filter(msg => msg.chatId !== chatId);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(filteredMessages));
      return true;
    } catch (error) {
      console.error('Failed to delete chat from localStorage:', error);
      return false;
    }
  },

  getAllMessages: (): DBMessage[] => {
    try {
      const messages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Failed to get messages from localStorage:', error);
      return [];
    }
  },

  getChatMessages: (chatId: string): DBMessage[] => {
    try {
      const messages = browserStorage.getAllMessages();
      return messages.filter(msg => msg.chatId === chatId);
    } catch (error) {
      console.error('Failed to get chat messages from localStorage:', error);
      return [];
    }
  },

  addMessage: (message: DBMessage): boolean => {
    try {
      const messages = browserStorage.getAllMessages();
      messages.push(message);
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('Failed to add message to localStorage:', error);
      return false;
    }
  }
};

// Sync mechanism
async function syncStorage() {
  if (!isElectron) return;

  try {
    // Get last sync timestamp
    const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    const lastSyncTime = lastSync ? parseInt(lastSync) : 0;
    const currentTime = Date.now();

    // Get data from both storages
    const electronChats = await window.electron.storage.getAllChats();
    const browserChats = browserStorage.getAllChats();
    
    // Merge chats, preferring the most recently updated ones
    const mergedChats = new Map<string, DBChat>();
    
    // First add all electron chats
    electronChats.forEach(chat => {
      mergedChats.set(chat.id, chat);
    });

    // Then merge browser chats, only if they're newer
    browserChats.forEach(chat => {
      const existing = mergedChats.get(chat.id);
      if (!existing || chat.lastUpdated > existing.lastUpdated) {
        mergedChats.set(chat.id, chat);
      }
    });

    const finalChats = Array.from(mergedChats.values())
      .sort((a, b) => b.lastUpdated - a.lastUpdated);

    // Get all messages from both storages
    const electronMessagesPromises = finalChats.map(chat => 
      window.electron.storage.getChatMessages(chat.id)
    );
    const electronMessages = (await Promise.all(electronMessagesPromises)).flat();
    const browserMessages = browserStorage.getAllMessages();
    
    // Merge messages, preferring the most recent ones
    const mergedMessages = new Map<string, DBMessage>();
    
    // First add all electron messages
    electronMessages.forEach(message => {
      mergedMessages.set(message.id, message);
    });

    // Then merge browser messages, only if they're newer
    browserMessages.forEach(message => {
      const existing = mergedMessages.get(message.id);
      if (!existing || message.timestamp > existing.timestamp) {
        mergedMessages.set(message.id, message);
      }
    });

    const finalMessages = Array.from(mergedMessages.values())
      .sort((a, b) => b.timestamp - a.timestamp);

    // Clear both storages before updating
    localStorage.clear();
    
    // Update browser storage
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(finalChats));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(finalMessages));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, currentTime.toString());

    // Update electron storage
    // First clear electron storage
    for (const chat of electronChats) {
      await window.electron.storage.deleteChat(chat.id);
    }
    
    // Then add all merged data
    for (const chat of finalChats) {
      await window.electron.storage.createChat(chat);
    }
    
    const chatMessages = finalMessages.reduce((acc, message) => {
      if (!acc[message.chatId]) {
        acc[message.chatId] = [];
      }
      acc[message.chatId].push(message);
      return acc;
    }, {} as Record<string, DBMessage[]>);

    for (const [chatId, messages] of Object.entries(chatMessages)) {
      for (const message of messages) {
        await window.electron.storage.addMessage(message);
      }
    }

  } catch (error) {
    console.error('Failed to sync storage:', error);
  }
}

// Export functions that work in both environments
export async function getAllChats(): Promise<DBChat[]> {
  try {
    await syncStorage();
    if (isElectron) {
      return await window.electron.storage.getAllChats();
    }
    return browserStorage.getAllChats();
  } catch (error) {
    console.error('Failed to get chats:', error);
    return [];
  }
}

export async function createChat(chat: DBChat): Promise<void> {
  try {
    const success = isElectron 
      ? await window.electron.storage.createChat(chat)
      : browserStorage.createChat(chat);
    
    if (!success) {
      throw new Error('Failed to create chat');
    }
    await syncStorage();
  } catch (error) {
    console.error('Failed to create chat:', error);
    throw error;
  }
}

export async function updateChat(chat: DBChat): Promise<void> {
  try {
    const success = isElectron
      ? await window.electron.storage.updateChat(chat)
      : browserStorage.updateChat(chat);
    
    if (!success) {
      throw new Error('Failed to update chat');
    }
    await syncStorage();
  } catch (error) {
    console.error('Failed to update chat:', error);
    throw error;
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  try {
    const success = isElectron
      ? await window.electron.storage.deleteChat(chatId)
      : browserStorage.deleteChat(chatId);
    
    if (!success) {
      throw new Error('Failed to delete chat');
    }
    await syncStorage();
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
}

export async function getChatMessages(chatId: string): Promise<DBMessage[]> {
  try {
    await syncStorage();
    if (isElectron) {
      return await window.electron.storage.getChatMessages(chatId);
    }
    return browserStorage.getChatMessages(chatId);
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    return [];
  }
}

export async function addMessage(message: DBMessage): Promise<void> {
  try {
    const success = isElectron
      ? await window.electron.storage.addMessage(message)
      : browserStorage.addMessage(message);
    
    if (!success) {
      throw new Error('Failed to add message');
    }
    await syncStorage();
  } catch (error) {
    console.error('Failed to add message:', error);
    throw error;
  }
} 