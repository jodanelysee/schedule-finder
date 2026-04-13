const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  ALLOWED_DIRS,
  safeReadFile,
  safeWriteFile,
  safeDeleteFile,
  safeListFiles,
} = require('../utils/pathSecurity');

// All routes are now relative to /api/v1/files
// So '/download' becomes '/api/v1/files/download'

// Download a file
router.get('/download', authenticate, async (req, res) => {
  try {
    const { filename, type = 'exports' } = req.query;
    
    console.log('Download request - filename:', filename, 'type:', type);
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    if (!ALLOWED_DIRS[type]) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: exports, uploads, temp, logs' });
    }
    
    const fileContent = await safeReadFile(ALLOWED_DIRS[type], filename, {
      maxSize: 50 * 1024 * 1024,
      allowedExtensions: ['.pdf', '.csv', '.xlsx', '.txt', '.json', '.jpg', '.png'],
    });
    
    const path = require('path');
    const ext = path.extname(filename).toLowerCase();
    const contentTypes = {
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
    };
    
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(fileContent);
    
  } catch (error) {
    console.error('Download error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// List files
router.get('/list', authenticate, async (req, res) => {
  try {
    const { type = 'exports', subpath = '' } = req.query;
    
    if (!ALLOWED_DIRS[type]) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    const files = await safeListFiles(ALLOWED_DIRS[type], subpath);
    
    res.json({
      type,
      files,
      count: files.length,
    });
    
  } catch (error) {
    console.error('List error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Upload a file
router.post('/upload', authenticate, async (req, res) => {
  try {
    const { filename, content, type = 'uploads' } = req.body;
    
    if (!filename || !content) {
      return res.status(400).json({ error: 'Filename and content required' });
    }
    
    if (!ALLOWED_DIRS[type]) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
      return res.status(400).json({ error: 'Invalid filename' });
    }
    
    const safePath = await safeWriteFile(ALLOWED_DIRS[type], filename, content, {
      maxSize: 10 * 1024 * 1024,
      allowedExtensions: ['.txt', '.json', '.csv', '.pdf'],
      overwrite: false,
    });
    
    res.json({
      message: 'File uploaded successfully',
      filename: filename,
      path: safePath,
    });
    
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

// Delete a file
router.delete('/delete', authenticate, async (req, res) => {
  try {
    const { filename, type = 'temp' } = req.query;
    
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    
    if (!ALLOWED_DIRS[type]) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    await safeDeleteFile(ALLOWED_DIRS[type], filename);
    
    res.json({ message: 'File deleted successfully' });
    
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;