import type { DBChat, DBMessage } from './types'
import '@/lib/electron-types'

// Check if we're running in Electron
const isElectron = typeof window !== 'undefined' && window.electron;

// LocalStorage keys
const STORAGE_KEYS = {
  CHATS: 'mata:chats',
  MESSAGES: 'mata:messages',
};

// Browser storage implementation (used only outside Electron, e.g. the Netlify preview)
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

// Electron's flat-file storage (via IPC) is the sole source of truth when running
// in Electron. No cross-sync with localStorage: a prior version merged the two on
// every call and wiped all of localStorage (including unrelated settings/theme keys)
// in the process.
export async function getAllChats(): Promise<DBChat[]> {
  try {
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
  } catch (error) {
    console.error('Failed to delete chat:', error);
    throw error;
  }
}

export async function getChatMessages(chatId: string): Promise<DBMessage[]> {
  try {
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
  } catch (error) {
    console.error('Failed to add message:', error);
    throw error;
  }
}
