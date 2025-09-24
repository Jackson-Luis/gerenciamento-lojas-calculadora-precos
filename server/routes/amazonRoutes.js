// routes/amazonRoutes.js
import express from 'express';
import { getGrantlessAccessToken, getAccessTokenWithRefresh, spApiFetch } from '../services/amazonService.js';
import { gerarConteudoIAComMesmoMolde } from '../services/iaService.js';

const router = express.Router();

router.post('/sandbox/process', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt é obrigatório' });
    const iaJson = await gerarConteudoIAComMesmoMolde(prompt);
    const accessToken = await getGrantlessAccessToken(['sellingpartnerapi::notifications']);
    const sp = await spApiFetch({ path: '/notifications/v1/destinations', method: 'GET', accessToken, useSandbox: true });
    res.json({ ok: true, environment: 'SANDBOX', ia: iaJson, spapi_check: sp });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha em /amazon/sandbox/process', detail: err.message });
  }
});

router.post('/prod/process', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt é obrigatório' });
    const iaJson = await gerarConteudoIAComMesmoMolde(prompt);
    const accessToken = await getAccessTokenWithRefresh();
    const sellers = await spApiFetch({ path: '/sellers/v1/marketplaceParticipations', method: 'GET', accessToken, useSandbox: false });
    res.json({ ok: true, environment: 'PRODUCTION', ia: iaJson, spapi_check: sellers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Falha em /amazon/prod/process', detail: err.message });
  }
});

// inventory endpoint example
router.get('/inventory', async (req, res) => {
  try {
    const accessToken = await getAccessTokenWithRefresh();
    const result = await spApiFetch({ path: '/fba/inventory/v1/summaries', method: 'GET', query: 'details=true&marketplaceIds=A2Q3Y263D00KWC', accessToken, useSandbox: false });
    res.json({ ok: true, inventory: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar estoque', detail: err.message });
  }
});

export default router;
