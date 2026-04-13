const path = require('path');
const fs = require('fs').promises;

// Whitelist of allowed directories (where files can be accessed from)
const ALLOWED_DIRS = {
  uploads: path.join(__dirname, '../uploads'),
  exports: path.join(__dirname, '../exports'),
  temp: path.join(__dirname, '../temp'),
  logs: path.join(__dirname, '../logs'),
};

// Create directories if they don't exist
async function ensureDirectories() {
  for (const [name, dirPath] of Object.entries(ALLOWED_DIRS)) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`Directory ready: ${name} -> ${dirPath}`);
    } catch (error) {
      console.error(`Failed to create ${name} directory:`, error.message);
    }
  }
}

// Validate and resolve path safely
function safePathResolve(baseDir, userPath) {
  // 1. Check if base directory is allowed
  const resolvedBase = path.resolve(baseDir);
  
  const isAllowed = Object.values(ALLOWED_DIRS).some(allowedDir => 
    resolvedBase === allowedDir || resolvedBase.startsWith(allowedDir)
  );
  
  if (!isAllowed) {
    throw new Error('Access denied: Invalid base directory');
  }
  
  // 2. Remove null bytes (termination attack)
  let sanitizedPath = userPath.replace(/\0/g, '');
  
  // 3. Remove URL encoded null bytes
  sanitizedPath = sanitizedPath.replace(/%00/g, '');
  
  // 4. Normalize path separators
  sanitizedPath = sanitizedPath.replace(/\\/g, '/');
  
  // 5. Check for dangerous patterns
  const dangerousPatterns = [
    '..',           // Parent directory
    '~',            // Home directory
    '%2e%2e',       // URL encoded ..
    '%252e%252e',   // Double URL encoded ..
    '//',           // Double slash
    '\\\\',         // Double backslash
    '..\\',         // Windows parent
    '../',          // Unix parent
    '.../',         // Triple dot
    '..../',        // Quad dot
  ];
  
  for (const pattern of dangerousPatterns) {
    if (sanitizedPath.toLowerCase().includes(pattern.toLowerCase())) {
      throw new Error(`Suspicious path pattern detected: ${pattern}`);
    }
  }
  
  // 6. Remove any remaining relative path components
  sanitizedPath = path.normalize(sanitizedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  
  // 7. Resolve the full path
  const resolvedPath = path.resolve(resolvedBase, sanitizedPath);
  
  // 8. Check if the resolved path is still within the base directory
  if (!resolvedPath.startsWith(resolvedBase)) {
    throw new Error('Path traversal detected: Attempting to access outside allowed directory');
  }
  
  // 9. Additional check: Ensure path doesn't contain null bytes after resolution
  if (resolvedPath.includes('\0')) {
    throw new Error('Invalid path: Contains null bytes');
  }
  
  return resolvedPath;
}

// Safe file read with size limits
async function safeReadFile(baseDir, userPath, options = {}) {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedExtensions = null,     // e.g., ['.jpg', '.pdf']
  } = options;
  
  // Resolve safe path
  const safePath = safePathResolve(baseDir, userPath);
  
  // Check file exists
  let stats;
  try {
    stats = await fs.stat(safePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('File not found');
    }
    throw new Error(`Cannot access file: ${error.message}`);
  }
  
  // Check if it's a file (not directory)
  if (!stats.isFile()) {
    throw new Error('Path points to a directory, not a file');
  }
  
  // Check file size
  if (stats.size > maxSize) {
    throw new Error(`File too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check file extension if specified
  if (allowedExtensions && allowedExtensions.length > 0) {
    const ext = path.extname(safePath).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
    }
  }
  
  // Read file
  return await fs.readFile(safePath);
}

// Safe file write with validation
async function safeWriteFile(baseDir, userPath, content, options = {}) {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedExtensions = ['.txt', '.json', '.csv', '.pdf'], // Default allowed
    overwrite = false,
  } = options;
  
  // Resolve safe path
  const safePath = safePathResolve(baseDir, userPath);
  
  // Check file size
  const contentSize = Buffer.byteLength(content);
  if (contentSize > maxSize) {
    throw new Error(`Content too large. Maximum size: ${maxSize / 1024 / 1024}MB`);
  }
  
  // Check file extension
  const ext = path.extname(safePath).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error(`File type not allowed. Allowed: ${allowedExtensions.join(', ')}`);
  }
  
  // Check if file exists and handle overwrite
  try {
    await fs.access(safePath);
    if (!overwrite) {
      throw new Error('File already exists and overwrite is disabled');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
    // File doesn't exist - that's fine for writing
  }
  
  // Ensure directory exists
  const dir = path.dirname(safePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Write file
  await fs.writeFile(safePath, content);
  
  return safePath;
}

// Safe file delete
async function safeDeleteFile(baseDir, userPath) {
  const safePath = safePathResolve(baseDir, userPath);
  
  // Check file exists
  try {
    await fs.access(safePath);
  } catch (error) {
    throw new Error('File not found');
  }
  
  // Delete file
  await fs.unlink(safePath);
  return true;
}

// List files in directory safely
async function safeListFiles(baseDir, userSubPath = '') {
  const targetPath = userSubPath 
    ? safePathResolve(baseDir, userSubPath)
    : baseDir;
  
  const files = await fs.readdir(targetPath);
  
  // Return file info without exposing full paths
  const fileInfos = await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(targetPath, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
      };
    })
  );
  
  return fileInfos;
}

module.exports = {
  ALLOWED_DIRS,
  ensureDirectories,
  safePathResolve,
  safeReadFile,
  safeWriteFile,
  safeDeleteFile,
  safeListFiles,
};