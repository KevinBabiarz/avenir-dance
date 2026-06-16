import express from 'express';
import { User } from '../models/User.js';
import { signToken, requireAuth } from '../middleware/auth.js';

export const authRouter = express.Router();

// Connexion administrateur
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'E-mail et mot de passe requis.' });
    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: 'Identifiants incorrects.' });
    const ok = await user.verifyPassword(password);
    if (!ok) return res.status(401).json({ error: 'Identifiants incorrects.' });
    res.json({ token: signToken(user), user: { email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

// Vérifie la validité du jeton courant
authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ user: { email: req.user.email, role: req.user.role } });
});

