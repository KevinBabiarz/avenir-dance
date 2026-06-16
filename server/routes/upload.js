import express from 'express';
import fs from 'fs';
import path from 'path';
import { upload, UPLOAD_DIR } from '../middleware/upload.js';
import { requireAuth } from '../middleware/auth.js';

export const uploadRouter = express.Router();

function publicUrl(req, filename) {
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

// Upload d'une seule image -> renvoie son URL publique
uploadRouter.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu (champ "image").' });
  res.status(201).json({
    url: publicUrl(req, req.file.filename),
    filename: req.file.filename,
    size: req.file.size,
  });
});

// Upload de plusieurs images (utile pour la galerie)
uploadRouter.post('/multiple', requireAuth, upload.array('images', 20), (req, res) => {
  if (!req.files || !req.files.length)
    return res.status(400).json({ error: 'Aucun fichier reçu (champ "images").' });
  res.status(201).json({
    files: req.files.map((f) => ({
      url: publicUrl(req, f.filename),
      filename: f.filename,
      size: f.size,
    })),
  });
});

// Suppression d'une image physique
uploadRouter.delete('/:filename', requireAuth, (req, res) => {
  const filename = path.basename(req.params.filename); // évite le path traversal
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT')
      return res.status(500).json({ error: 'Impossible de supprimer le fichier.' });
    res.json({ ok: true });
  });
});

