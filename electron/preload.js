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
    'minimize-window',
    'maximize-window',
    'close-window',
    'toggle-compact-mode',
    'get-window-mode',
    'toggle-quick-ask',
    'hide-quick-ask',
    'resize-quick-ask'
  ],
  receive: [
    'system-info',
    'resource-usage',
    'window-maximized'
  ]
};

// Unwraps the main process's {ok, value} / {ok: false, error} result shape into a
// plain return value or a thrown Error carrying the original error's code/retryable
// fields (thrown Error objects alone lose custom properties over Electron IPC).
function unwrap(result) {
  if (result.ok) return result.value;
  const error = new Error(result.error.message);
  Object.assign(error, result.error);
  throw error;
}

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
        },
        updateMessage: async (message) => {
          try {
            debugLog('Updating message:', message);
            return await ipcRenderer.invoke('update-message', message);
          } catch (error) {
            console.error('Failed to update message:', error);
            throw error;
          }
        },
        deleteMessage: async (messageId) => {
          try {
            debugLog('Deleting message:', messageId);
            return await ipcRenderer.invoke('delete-message', messageId);
          } catch (error) {
            console.error('Failed to delete message:', error);
            throw error;
          }
        },
        getAllFolders: async () => {
          try {
            return await ipcRenderer.invoke('get-all-folders');
          } catch (error) {
            console.error('Failed to get folders:', error);
            throw error;
          }
        },
        createFolder: async (folder) => {
          try {
            return await ipcRenderer.invoke('create-folder', folder);
          } catch (error) {
            console.error('Failed to create folder:', error);
            throw error;
          }
        },
        updateFolder: async (folder) => {
          try {
            return await ipcRenderer.invoke('update-folder', folder);
          } catch (error) {
            console.error('Failed to update folder:', error);
            throw error;
          }
        },
        deleteFolder: async (folderId) => {
          try {
            return await ipcRenderer.invoke('delete-folder', folderId);
          } catch (error) {
            console.error('Failed to delete folder:', error);
            throw error;
          }
        }
      },
      // Sign in with ChatGPT — renderer only ever sees session state and chat
      // text, never OAuth tokens.
      chatgpt: {
        signIn: async (options) => unwrap(await ipcRenderer.invoke('chatgpt-sign-in', options)),
        cancelSignIn: async () => unwrap(await ipcRenderer.invoke('chatgpt-cancel-sign-in')),
        signOut: async () => unwrap(await ipcRenderer.invoke('chatgpt-sign-out')),
        getSession: async () => unwrap(await ipcRenderer.invoke('chatgpt-get-session')),
        listProfiles: async () => unwrap(await ipcRenderer.invoke('chatgpt-list-profiles')),
        selectProfile: async (profileId) => unwrap(await ipcRenderer.invoke('chatgpt-select-profile', profileId)),
        listModels: async () => unwrap(await ipcRenderer.invoke('chatgpt-list-models')),
        streamResponse: async (payload) => unwrap(await ipcRenderer.invoke('chatgpt-stream-response', payload)),
        cancelStream: async (requestId) => ipcRenderer.invoke('chatgpt-cancel-stream', requestId),
        onSessionChanged: (callback) => {
          const listener = (event, session) => callback(session);
          ipcRenderer.on('chatgpt-session-changed', listener);
          return () => ipcRenderer.removeListener('chatgpt-session-changed', listener);
        },
        onStreamChunk: (callback) => {
          const listener = (event, payload) => callback(payload);
          ipcRenderer.on('chatgpt-stream-chunk', listener);
          return () => ipcRenderer.removeListener('chatgpt-stream-chunk', listener);
        },
      }
    }
  );

  debugLog('IPC bridge initialized successfully');
} catch (error) {
  console.error('Failed to initialize IPC bridge:', error);
}
