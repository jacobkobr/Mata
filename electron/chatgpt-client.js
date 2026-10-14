// Main-process-only wiring for Sign in with ChatGPT (@siwc/local). The renderer never
// touches OAuth tokens — only session/account state and chat text cross the IPC boundary.
const { app, ipcMain, shell, safeStorage, BrowserWindow } = require('electron');
const { createElectronCredentialEncryption } = require('./chatgpt-credential-encryption');

let clientPromise = null;
const activeStreams = new Map();

function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      // @siwc/local is ESM-only; dynamic import works from this CommonJS main process.
      const { createChatGPT } = await import('@siwc/local');
      const credentialEncryption = createElectronCredentialEncryption(safeStorage, () => app.isReady());
      return createChatGPT({
        appName: 'Mata',
        appId: 'com.jacobkobr.mata',
        redirectPort: 0,
        credentialEncryption,
        openBrowser: (url) => shell.openExternal(url),
      });
    })();
  }
  return clientPromise;
}

// Converts a thrown ChatGPTError (or any error) into a plain, IPC-serializable shape.
// Thrown Error objects lose custom properties (code, retryable, ...) over Electron IPC,
// so every handler below returns a {ok, value} / {ok: false, error} result instead of throwing.
function toSerializableError(error) {
  if (error && typeof error.toJSON === 'function') {
    return error.toJSON();
  }
  return {
    code: 'unknown_error',
    message: error instanceof Error ? error.message : 'Something went wrong talking to ChatGPT.',
    retryable: false,
  };
}

async function handle(fn) {
  try {
    const value = await fn();
    return { ok: true, value };
  } catch (error) {
    return { ok: false, error: toSerializableError(error) };
  }
}

function registerChatGPTHandlers(getBrowserWindow) {
  ipcMain.handle('chatgpt-sign-in', (event, options) =>
    handle(async () => (await getClient()).signIn(options))
  );

  ipcMain.handle('chatgpt-cancel-sign-in', (event) =>
    handle(async () => (await getClient()).cancelSignIn())
  );

  ipcMain.handle('chatgpt-sign-out', (event) =>
    handle(async () => (await getClient()).disconnect())
  );

  ipcMain.handle('chatgpt-get-session', (event) =>
    handle(async () => (await getClient()).getSession())
  );

  ipcMain.handle('chatgpt-list-profiles', (event) =>
    handle(async () => (await getClient()).listProfiles())
  );

  ipcMain.handle('chatgpt-select-profile', (event, profileId) =>
    handle(async () => (await getClient()).selectProfile(profileId))
  );

  ipcMain.handle('chatgpt-list-models', (event) =>
    handle(async () => (await getClient()).listModels())
  );

  ipcMain.handle('chatgpt-stream-response', (event, { requestId, model, input, instructions }) =>
    handle(async () => {
      const client = await getClient();
      const controller = new AbortController();
      activeStreams.set(requestId, controller);
      try {
        return await client.streamResponse({
          model,
          input,
          instructions,
          signal: controller.signal,
          onDelta: (delta) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            if (window && !window.isDestroyed()) {
              window.webContents.send('chatgpt-stream-chunk', { requestId, delta });
            }
          },
        });
      } finally {
        activeStreams.delete(requestId);
      }
    })
  );

  ipcMain.handle('chatgpt-cancel-stream', (event, requestId) => {
    const controller = activeStreams.get(requestId);
    if (controller) controller.abort();
    return true;
  });

  // Forward session changes (sign-in/out, reauth required, etc.) to the renderer.
  getClient().then((client) => {
    client.subscribe((session) => {
      const window = getBrowserWindow();
      if (window && !window.isDestroyed()) {
        window.webContents.send('chatgpt-session-changed', session);
      }
    });
  }).catch((error) => {
    console.error('Failed to initialize ChatGPT client:', error);
  });
}

module.exports = { registerChatGPTHandlers };
