// Adapts Electron's safeStorage (Keychain on macOS, DPAPI on Windows, libsecret/kwallet
// on Linux) to @siwc/local's CredentialEncryption interface. Ported from the official
// devkit's examples/paste-perfect/electron/credential-encryption.ts reference adapter.
// Lives in the main process only — never expose this module or its output to the renderer.

function createElectronCredentialEncryption(storage, isReady, platform = process.platform) {
  const isAvailable = () => {
    if (!isReady() || !storage.isEncryptionAvailable()) return false;
    // Electron's Linux basic_text backend uses a hardcoded key. Refuse it.
    return platform !== 'linux' || ['gnome_libsecret', 'kwallet', 'kwallet5', 'kwallet6'].includes(storage.getSelectedStorageBackend());
  };
  const requireAvailable = () => {
    if (!isAvailable()) throw new Error('OS credential encryption is unavailable.');
  };
  return {
    id: 'electron-safe-storage-v1',
    isAvailable,
    encrypt(plaintext) {
      requireAvailable();
      return storage.encryptString(plaintext);
    },
    decrypt(ciphertext) {
      requireAvailable();
      return storage.decryptString(Buffer.from(ciphertext));
    },
  };
}

module.exports = { createElectronCredentialEncryption };
