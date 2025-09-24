// routes/emailRoutes.js
import express from 'express';
import { enviarEmail } from '../services/emailService.js';
import { autenticarToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/send', autenticarToken, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    await enviarEmail({ to, subject, text, html });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.get('/verificar-email', autenticarToken, async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ exists: false });
    const { rows } = await (await import('../config/db.js')).pool.query('SELECT id FROM funcionario WHERE email = $1', [email]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ exists: false });
  }
});

export default router;
