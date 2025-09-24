// routes/iaRoutes.js
import express from 'express';
import { gerarConteudoIAComMesmoMolde } from '../services/iaService.js';
import { getGrantlessAccessToken, spApiFetch } from '../services/amazonService.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt é obrigatório' });
    const json = await gerarConteudoIAComMesmoMolde(prompt);
    res.json({ ok: true, ia: json });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha ao gerar JSON da IA', detail: err.message });
  }
});

router.post('/sandbox-check', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt é obrigatório' });
    const iaJson = await gerarConteudoIAComMesmoMolde(prompt);
    const keywords = (iaJson.palavras_chave||'').split(/[;,\n]/).map(s=>s.trim()).filter(Boolean);
    const accessToken = await getGrantlessAccessToken(['sellingpartnerapi::notifications']);
    const notifResp = await spApiFetch({ path: '/notifications/v1/destinations', method: 'GET', accessToken, useSandbox: true });
    res.json({ ok:true, ia_mapped:{keywords}, spapi_check:notifResp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha no sandbox-check', detail: err.message });
  }
});

export default router;
