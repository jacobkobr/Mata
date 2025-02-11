const { contextBridge, ipcRenderer } = require('electron');

// Debug flag
const DEBUG = true;

function debugLog(...args) {
  if (DEBUG) {
    console.log('[Preload Debug]:', ...args);
  }
}

// Whitelist of valid channels
const validChannels = {
  send: [
    'get-system-info',
    'start-monitoring',
    'stop-monitoring',
    'add-message',
    'get-messages',
    'clear-messages',
    'get-settings',
    'update-settings',
    'minimize-window',
    'maximize-window',
    'close-window',
    'toggle-compact-mode',
    'get-window-mode'
  ],
  receive: [
    'system-info',
    'resource-usage',
    'window-maximized'
  ]
};

try {
  debugLog('Initializing IPC bridge...');

  // Expose protected methods that allow the renderer process to use
  // the ipcRenderer without exposing the entire object
  contextBridge.exposeInMainWorld(
    'electron',
    {
      send: async (channel, ...args) => {
        debugLog('Sending on channel:', channel, 'with args:', args);
        if (validChannels.send.includes(channel)) {
          try {
            const result = await ipcRenderer.invoke(channel, ...args);
            debugLog('Received result:', result);
            return result;
          } catch (error) {
            console.error('IPC send error:', error);
            throw error;
          }
        } else {
          console.error('Invalid send channel:', channel);
        }
      },
      receive: (channel, func) => {
        debugLog('Setting up receiver for channel:', channel);
        if (validChannels.receive.includes(channel)) {
          // Deliberately strip event as it includes `sender` 
          ipcRenderer.on(channel, (event, ...args) => {
            debugLog('Received on channel:', channel, 'with args:', args);
            func(...args);
          });
        } else {
          console.error('Invalid receive channel:', channel);
        }
      },
      removeListener: (channel, func) => {
        debugLog('Removing listener for channel:', channel);
        if (validChannels.receive.includes(channel)) {
          ipcRenderer.removeListener(channel, func);
        } else {
          console.error('Invalid remove listener channel:', channel);
        }
      },
      // Storage methods with error handling
      storage: {
        getAllChats: async () => {
          try {
            debugLog('Getting all chats...');
            return await ipcRenderer.invoke('get-all-chats');
          } catch (error) {
            console.error('Failed to get chats:', error);
            throw error;
          }
        },
        createChat: async (chat) => {
          try {
            debugLog('Creating chat:', chat);
            return await ipcRenderer.invoke('create-chat', chat);
          } catch (error) {
            console.error('Failed to create chat:', error);
            throw error;
          }
        },
        updateChat: async (chat) => {
          try {
            debugLog('Updating chat:', chat);
            return await ipcRenderer.invoke('update-chat', chat);
          } catch (error) {
            console.error('Failed to update chat:', error);
            throw error;
          }
        },
        deleteChat: async (chatId) => {
          try {
            debugLog('Deleting chat:', chatId);
            return await ipcRenderer.invoke('delete-chat', chatId);
          } catch (error) {
            console.error('Failed to delete chat:', error);
            throw error;
          }
        },
        getChatMessages: async (chatId) => {
          try {
            debugLog('Getting chat messages:', chatId);
            return await ipcRenderer.invoke('get-chat-messages', chatId);
          } catch (error) {
            console.error('Failed to get messages:', error);
            throw error;
          }
        },
        addMessage: async (message) => {
          try {
            debugLog('Adding message:', message);
            return await ipcRenderer.invoke('add-message', message);
          } catch (error) {
            console.error('Failed to add message:', error);
            throw error;
          }
        }
      }
    }
  );

  debugLog('IPC bridge initialized successfully');
} catch (error) {
  console.error('Failed to initialize IPC bridge:', error);
} 