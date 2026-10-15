const { dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Keeps a single picked file/folder from turning into a multi-megabyte prompt.
// These are generous enough for real source files/folders but still bounded.
const MAX_SINGLE_FILE_BYTES = 1_000_000; // 1MB
const MAX_FOLDER_TOTAL_BYTES = 2_000_000; // 2MB
const MAX_FOLDER_FILES = 200;

const SKIP_DIR_NAMES = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', '.venv', '__pycache__']);

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.7z', '.rar',
  '.exe', '.dll', '.so', '.dylib', '.bin', '.wasm',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp3', '.mp4', '.mov', '.avi', '.wav', '.flac',
  '.db', '.sqlite', '.sqlite3',
]);

// Filenames worth a second look before they leave the machine as chat context.
const SENSITIVE_NAME_PATTERN = /(^|[\\/])\.env(\.[^\\/]*)?$|\.pem$|\.key$|credentials\.json$|id_rsa$|id_ed25519$/i;

function isLikelySensitive(filePath) {
  return SENSITIVE_NAME_PATTERN.test(filePath);
}

function isLikelyBinary(filePath) {
  if (BINARY_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return true;
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(8000);
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  } catch {
    return true; // can't be sure it's text — err on the side of not pasting it into chat
  }
}

function readSingleFile(filePath) {
  const stat = fs.statSync(filePath);
  const name = path.basename(filePath);
  const sensitive = isLikelySensitive(filePath);

  if (isLikelyBinary(filePath)) {
    return { canceled: false, error: `"${name}" doesn't look like a text file — only text content can be attached as context.` };
  }

  const truncated = stat.size > MAX_SINGLE_FILE_BYTES;
  const buffer = Buffer.alloc(Math.min(stat.size, MAX_SINGLE_FILE_BYTES));
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, buffer.length, 0);
  fs.closeSync(fd);

  return {
    canceled: false,
    isDirectory: false,
    path: filePath,
    name,
    content: buffer.toString('utf8'),
    sensitiveFiles: sensitive ? [name] : [],
    truncated,
    totalBytes: stat.size,
    includedBytes: buffer.length,
    fileCount: 1,
  };
}

function walkDirectory(rootDir) {
  const files = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= MAX_FOLDER_FILES) return;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIR_NAMES.has(entry.name) || entry.name.startsWith('.')) continue;
        walk(full);
      } else if (entry.isFile()) {
        files.push(full);
      }
    }
  }
  walk(rootDir);
  return files;
}

function readFolder(folderPath) {
  const name = path.basename(folderPath);
  const allFiles = walkDirectory(folderPath);
  const sensitiveFiles = [];
  const parts = [];
  let includedBytes = 0;
  let totalBytes = 0;
  let includedCount = 0;
  let skippedBinary = 0;

  for (const filePath of allFiles) {
    let stat;
    try {
      stat = fs.statSync(filePath);
    } catch {
      continue;
    }
    totalBytes += stat.size;
    const relative = path.relative(folderPath, filePath);

    if (isLikelySensitive(filePath)) sensitiveFiles.push(relative);

    if (isLikelyBinary(filePath)) {
      skippedBinary++;
      continue;
    }
    if (includedBytes >= MAX_FOLDER_TOTAL_BYTES) continue;

    const remaining = MAX_FOLDER_TOTAL_BYTES - includedBytes;
    const readSize = Math.min(stat.size, remaining);
    const buffer = Buffer.alloc(readSize);
    try {
      const fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, readSize, 0);
      fs.closeSync(fd);
    } catch {
      continue;
    }
    parts.push(`--- ${relative} ---\n${buffer.toString('utf8')}`);
    includedBytes += readSize;
    includedCount++;
  }

  // "truncated" means actual content got cut off by a size/count limit —
  // skipping binary files is normal and expected, so it gets its own field
  // instead of triggering the same scary warning in the UI.
  const truncated = includedBytes >= MAX_FOLDER_TOTAL_BYTES || allFiles.length > MAX_FOLDER_FILES;

  return {
    canceled: false,
    isDirectory: true,
    path: folderPath,
    name,
    content: parts.join('\n\n'),
    sensitiveFiles,
    truncated,
    totalBytes,
    includedBytes,
    fileCount: includedCount,
    skippedBinaryCount: skippedBinary,
  };
}

async function pickAttachment(window) {
  const result = await dialog.showOpenDialog(window, {
    properties: ['openFile', 'openDirectory'],
    title: 'Attach file or folder as context',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { canceled: true };
  }

  const picked = result.filePaths[0];
  try {
    const stat = fs.statSync(picked);
    if (stat.isDirectory()) {
      return readFolder(picked);
    }
    return readSingleFile(picked);
  } catch (error) {
    return { canceled: false, error: `Couldn't read "${picked}": ${error.message}` };
  }
}

module.exports = { pickAttachment };
