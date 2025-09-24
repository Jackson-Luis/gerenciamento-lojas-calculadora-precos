// routes/lojaRoutes.js
import express from "express";
import { pool } from "../config/db.js";
import { autenticarToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT l.*, c.nome AS cliente_nome, f.nome AS funcionario_nome FROM loja l JOIN cliente c ON l.cliente_id = c.id JOIN funcionario f ON l.funcionario_id = f.id`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao buscar lojas", details: err.message });
  }
});

router.post("/", autenticarToken, async (req, res) => {
  const {
    funcionario_id,
    cliente_id,
    nome,
    anuncios_total,
    anuncios_realizados,
    anuncios_otimizados,
    visitas_semana,
    produto_mais_visitado,
    vendas_total,
    is_ativo,
  } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO loja (funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        funcionario_id,
        cliente_id,
        nome,
        anuncios_total,
        anuncios_realizados,
        anuncios_otimizados,
        visitas_semana,
        produto_mais_visitado,
        vendas_total,
        is_ativo,
      ]
    );
    res.status(201).json({ id: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar loja", details: err.message });
  }
});

router.put("/:id", autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    funcionario_id,
    cliente_id,
    nome,
    anuncios_total,
    anuncios_realizados,
    anuncios_otimizados,
    visitas_semana,
    produto_mais_visitado,
    vendas_total,
    is_ativo,
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE loja SET funcionario_id=$1, cliente_id=$2, nome=$3, anuncios_total=$4, anuncios_realizados=$5, anuncios_otimizados=$6, visitas_semana=$7, produto_mais_visitado=$8, vendas_total=$9, is_ativo=$10 WHERE id=$11`,
      [
        funcionario_id,
        cliente_id,
        nome,
        anuncios_total,
        anuncios_realizados,
        anuncios_otimizados,
        visitas_semana,
        produto_mais_visitado,
        vendas_total,
        is_ativo,
        id,
      ]
    );
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao atualizar loja", details: err.message });
  }
});

router.delete("/:id", autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query("DELETE FROM loja WHERE id=$1", [id]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao excluir loja", details: err.message });
  }
});

export default router;
