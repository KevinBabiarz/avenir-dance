import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

// Crée le dossier uploads s'il n'existe pas
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/avif', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]/gi, '-')
      .toLowerCase()
      .slice(0, 40);
    const unique = `${base || 'image'}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, unique);
  },
});

function fileFilter(req, file, cb) {
  if (ALLOWED.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format d\'image non supporté (PNG, JPEG, WebP, AVIF ou GIF attendu).'));
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 Mo max
});

export { UPLOAD_DIR };

