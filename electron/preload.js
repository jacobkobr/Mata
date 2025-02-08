const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electron',
  {
    send: async (channel) => {
      const validChannels = ['minimize-window', 'maximize-window', 'close-window'];
      if (validChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel);
      }
    },
    receive: (channel, func) => {
      const validChannels = ['window-maximized'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender` 
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    removeListener: (channel, func) => {
      const validChannels = ['window-maximized'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, func);
      }
    }
  }
); 