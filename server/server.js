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
const ROOT_DIR = path.join(__dirname, '..');
const app = express();
const PORT = process.env.PORT || 4000;

// Railway / reverse proxy : nécessaire pour récupérer l'IP cliente et le bon protocole
app.set('trust proxy', 1);

// CORS : autorise le(s) domaine(s) du frontend.
// Définissez FRONTEND_URL dans les variables Railway, par ex :
//   FRONTEND_URL=https://www.avenircrazydance.be
// Plusieurs origines possibles via virgules :
//   FRONTEND_URL=https://www.avenircrazydance.be,https://avenircrazydance.be
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

// On autorise toujours le domaine du serveur lui-même (Railway, domaines custom)
// pour que l'admin (/admin) et /site fonctionnent quel que soit l'host.
const selfDomains = new Set();
if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  selfDomains.add(`https://${process.env.RAILWAY_PUBLIC_DOMAIN}`);
}
if (process.env.RAILWAY_STATIC_URL) {
  selfDomains.add(process.env.RAILWAY_STATIC_URL.replace(/\/+$/, ''));
}
if (process.env.PUBLIC_URL) {
  selfDomains.add(process.env.PUBLIC_URL.replace(/\/+$/, ''));
}

const corsOptions = {
  origin: (origin, cb) => {
    // Requêtes same-origin (admin servi par Railway), Postman, curl, etc. → pas d'origin
    if (!origin) return cb(null, true);
    const clean = origin.replace(/\/+$/, '');
    // Toujours autoriser le domaine du serveur lui-même (admin, /site, etc.)
    if (selfDomains.has(clean)) return cb(null, true);
    // Si aucune liste blanche n'est définie, on autorise tout (mode dev / migration)
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(clean)) return cb(null, true);
    // Origine refusée : on renvoie false (pas d'erreur 500) → le navigateur affichera
    // un message CORS clair au lieu d'un status:null trompeur.
    console.warn(`[CORS] Origine refusée : ${origin}`);
    return cb(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
// Répond aux requêtes preflight OPTIONS pour toutes les routes
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '2mb' }));

// Fichiers statiques : images uploadées + interface d'administration + site vitrine
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
// Sert les fichiers du site vitrine (index.html, adc-frontend.js, etc.) à la racine
app.use(
  express.static(ROOT_DIR, {
    index: 'index.html',
    extensions: ['html'],
  })
);

// API
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/teachers', teachersRouter);
app.use('/api/posts', postsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/gallery', galleryRouter);
app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Alias historique : /site sert également la vitrine
app.get('/site', (req, res) =>
  res.sendFile(path.join(ROOT_DIR, 'index.html'))
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

