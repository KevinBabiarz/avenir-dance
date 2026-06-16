import express from 'express';
import nodemailer from 'nodemailer';

export const contactRouter = express.Router();

/**
 * Construit le transport SMTP à partir des variables d'environnement.
 * Renvoie `null` si la configuration SMTP est absente (mode dégradé : on
 * journalise le message au lieu de tenter un envoi).
 */
function buildTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: String(SMTP_SECURE).toLowerCase() === 'true',
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Réception d'un message du formulaire de contact public
contactRouter.post('/', async (req, res, next) => {
  try {
    const nom = String(req.body.nom || '').trim();
    const email = String(req.body.email || '').trim();
    const tel = String(req.body.tel || '').trim();
    const cours = String(req.body.cours || '').trim();
    const message = String(req.body.message || '').trim();

    // Validation minimale (mêmes règles que le formulaire)
    if (!nom || !email || !message) {
      return res.status(400).json({ error: 'Merci de remplir les champs Nom, E-mail et Message.' });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Cette adresse e-mail ne semble pas valide." });
    }

    // >>> Destinataire = mail de direction, configurable via CONTACT_EMAIL <<<
    const to = process.env.CONTACT_EMAIL;
    if (!to) {
      console.warn('⚠ CONTACT_EMAIL non défini : impossible d’expédier le message de contact.');
      return res.status(500).json({ error: "Le destinataire des messages n'est pas configuré." });
    }

    const from = process.env.SMTP_FROM || `Site Avenir Crazy Dance <no-reply@avenircrazydance.be>`;
    const subject = `Nouveau message du site — ${nom}`;
    const lines = [
      `Nom : ${nom}`,
      `E-mail : ${email}`,
      tel ? `Téléphone : ${tel}` : null,
      cours ? `Cours souhaité : ${cours}` : null,
      '',
      message,
    ].filter((l) => l !== null);
    const text = lines.join('\n');

    const transport = buildTransport();
    if (!transport) {
      // Mode dégradé : pas de SMTP configuré → on trace le message côté serveur.
      console.info('—'.repeat(48));
      console.info(`📬 Message de contact destiné à ${to}`);
      console.info(text);
      console.info('—'.repeat(48));
      return res.json({ ok: true, delivered: false });
    }

    await transport.sendMail({
      from,
      to,
      replyTo: `${nom} <${email}>`, // répondre directement au visiteur
      subject,
      text,
    });

    res.json({ ok: true, delivered: true });
  } catch (err) {
    next(err);
  }
});

