import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { UPLOAD_DIR } from './middleware/upload.js';

import { authRouter } from './routes/auth.js';
import { uploadRouter } from './routes/upload.js';
import { coursesRouter } from './routes/courses.js';
import { teachersRouter } from './routes/teachers.js';
import { postsRouter } from './routes/posts.js';
import { eventsRouter } from './routes/events.js';
import { galleryRouter } from './routes/gallery.js';
import { contactRouter } from './routes/contact.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Fichiers statiques : images uploadées + interface d'administration
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// API
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/contact', contactRouter);

app.get('/', (req, res) => res.redirect('/admin'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Sert la page vitrine (standalone) en même origine que l'API
app.get('/site', (req, res) =>
  res.sendFile(path.join(__dirname, '..', 'index.html'))
);

// Gestion centralisée des erreurs (Multer, validation Mongoose, etc.)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Identifiant invalide.' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur.' });
});

// Crée le compte admin initial à partir du .env s'il n'existe pas encore
async function ensureAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email });
  if (existing) return;
  const passwordHash = await User.hashPassword(password);
  await User.create({ email, passwordHash, role: 'admin' });
  console.log(`✓ Compte admin créé : ${email}`);
}

async function start() {
  await connectDB(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/avenir_crazy_dance');
  await ensureAdmin();
  app.listen(PORT, () => {
    console.log(`✓ Serveur démarré : http://localhost:${PORT}`);
    console.log(`  Interface admin : http://localhost:${PORT}/admin`);
  });
}

start();

