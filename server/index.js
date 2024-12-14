// server/index.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs').promises;

const app = express();
const port = 3001;

// Use Object.assign instead of util._extend
const config = Object.assign({}, {
  uploadDir: 'uploads',
  allowedTypes: /jpeg|jpg|png|gif/
});

// Middleware
app.use(cors());
app.use('/uploads', express.static(config.uploadDir));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.access(config.uploadDir).catch(async () => {
        await fs.mkdir(config.uploadDir);
      });
      cb(null, config.uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extname = config.allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = config.allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Routes
app.post('/upload', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({
    message: 'File uploaded successfully',
    filename: req.file.filename
  });
});

app.get('/photos', async (req, res) => {
  try {
    const files = await fs.readdir(config.uploadDir);
    const photos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Unable to read directory' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});