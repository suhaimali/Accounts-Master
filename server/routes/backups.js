const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// @GET /api/backups - List all backups
router.get('/', protect, authorize('admin'), (req, res) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const backups = files
      .filter(f => f.endsWith('.json'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    
    res.json({ success: true, data: backups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @POST /api/backups - Create a new backup
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const collections = await mongoose.connection.db.collections();
    const backupData = {};
    
    for (let collection of collections) {
      const documents = await collection.find({}).toArray();
      backupData[collection.collectionName] = documents;
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    const stats = fs.statSync(filepath);
    res.json({ 
      success: true, 
      message: 'Backup created successfully',
      data: {
        filename,
        size: stats.size,
        createdAt: stats.birthtime
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @DELETE /api/backups/:filename - Delete a backup
router.delete('/:filename', protect, authorize('admin'), (req, res) => {
  try {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }
    
    fs.unlinkSync(filepath);
    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @GET /api/backups/:filename/download - Download a backup
router.get('/:filename/download', protect, authorize('admin'), (req, res) => {
  try {
    const filepath = path.join(BACKUP_DIR, req.params.filename);
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }
    
    res.download(filepath);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
