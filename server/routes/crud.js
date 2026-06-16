import express from 'express';
import { requireAuth } from '../middleware/auth.js';

/**
 * Génère un routeur CRUD standard pour un modèle Mongoose.
 * - GET    /            liste (publique, triée par `order` puis date)
 * - GET    /:id         détail (publique)
 * - POST   /            création (protégée)
 * - PUT    /:id         mise à jour (protégée)
 * - DELETE /:id         suppression (protégée)
 *
 * @param {mongoose.Model} Model
 * @param {object} options { sort, allowed }
 */
export function crudRouter(Model, options = {}) {
  const router = express.Router();
  const sort = options.sort || { order: 1, createdAt: -1 };
  // Liste blanche des champs modifiables par l'API
  const allowed = options.allowed || null;

  function pick(body) {
    if (!allowed) return body;
    const out = {};
    for (const key of allowed) {
      if (body[key] !== undefined) out[key] = body[key];
    }
    return out;
  }

  // Liste — supporte ?all=1 pour inclure le contenu non publié (admin)
  router.get('/', async (req, res, next) => {
    try {
      const filter = req.query.all === '1' ? {} : { published: true };
      const items = await Model.find(filter).sort(sort);
      res.json(items);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const item = await Model.findById(req.params.id);
      if (!item) return res.status(404).json({ error: 'Introuvable.' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', requireAuth, async (req, res, next) => {
    try {
      const item = await Model.create(pick(req.body));
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', requireAuth, async (req, res, next) => {
    try {
      const item = await Model.findByIdAndUpdate(req.params.id, pick(req.body), {
        new: true,
        runValidators: true,
      });
      if (!item) return res.status(404).json({ error: 'Introuvable.' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', requireAuth, async (req, res, next) => {
    try {
      const item = await Model.findByIdAndDelete(req.params.id);
      if (!item) return res.status(404).json({ error: 'Introuvable.' });
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

