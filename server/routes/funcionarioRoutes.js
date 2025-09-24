// routes/funcionarioRoutes.js
import express from "express";
import { pool } from "../config/db.js";
import { autenticarToken } from "../middlewares/auth.js";
import bcrypt from "bcrypt";

const router = express.Router();

router.get("/", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM funcionario");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao buscar funcionários", details: err.message });
  }
});

router.post("/", autenticarToken, async (req, res) => {
  const {
    nome,
    telefone,
    email,
    senha,
    valor_receber,
    data_receber_pagamento,
    chave_pix,
    relatorio_liberado,
    calculadora_liberada,
    administrador_geral,
    is_ativo,
  } = req.body;
  try {
    if (!nome || !email || !senha)
      return res
        .status(400)
        .json({ error: "Nome, email e senha são obrigatórios" });
    const { rows: existentes } = await pool.query(
      "SELECT id FROM funcionario WHERE email = $1",
      [email]
    );
    if (existentes.length)
      return res
        .status(400)
        .json({ error: "Email já está em uso por outro funcionário." });
    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO funcionario (nome, telefone, email, senha, valor_receber, data_receber_pagamento, chave_pix, relatorio_liberado, calculadora_liberada, administrador_geral, is_ativo) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        nome,
        telefone,
        email,
        senhaHash,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
      ]
    );
    res
      .status(201)
      .json({
        id: rows[0].id,
        nome,
        telefone,
        email,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
      });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao criar funcionário", details: err.message });
  }
});

router.put("/:id", autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    nome,
    telefone,
    email,
    valor_receber,
    data_receber_pagamento,
    chave_pix,
    relatorio_liberado,
    calculadora_liberada,
    administrador_geral,
    is_ativo,
  } = req.body;
  try {
    if (!nome || !email)
      return res.status(400).json({ error: "Nome e email são obrigatórios" });
    const { rows: existentes } = await pool.query(
      "SELECT id FROM funcionario WHERE email = $1 AND id != $2",
      [email, id]
    );
    if (existentes.length)
      return res
        .status(400)
        .json({ error: "Email já está em uso por outro funcionário." });
    const result = await pool.query(
      `UPDATE funcionario SET nome = $1, telefone = $2, email = $3, valor_receber = $4, data_receber_pagamento = $5, chave_pix = $6, relatorio_liberado = $7, calculadora_liberada = $8, administrador_geral = $9, is_ativo = $10 WHERE id = $11`,
      [
        nome,
        telefone,
        email,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
        id,
      ]
    );
    if (result.rowCount)
      res.json({
        id,
        nome,
        telefone,
        email,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
      });
    else res.status(404).json({ error: "Funcionário não encontrado" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao atualizar funcionário", details: err.message });
  }
});

router.delete("/:id", autenticarToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    await client.query("BEGIN");
    await client.query(
      "UPDATE loja SET funcionario_id = NULL WHERE funcionario_id = $1",
      [id]
    );
    const result = await client.query("DELETE FROM funcionario WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao excluir funcionário", details: err.message });
  } finally {
    client.release();
  }
});

export default router;
