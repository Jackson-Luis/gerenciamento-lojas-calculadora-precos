// routes/clienteRoutes.js
import express from "express";
import { pool } from "../config/db.js";
import { autenticarToken } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM cliente");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao buscar clientes", details: err.message });
  }
});

router.post("/", autenticarToken, async (req, res) => {
  try {
    const { nome, telefone, is_ativo } = req.body;
    const result = await pool.query(
      "INSERT INTO cliente (nome, telefone, is_ativo) VALUES ($1, $2, $3) RETURNING id",
      [nome, telefone, is_ativo]
    );
    res.status(201).json({ id: result.rows[0].id, nome, telefone, is_ativo });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao criar cliente", details: err.message });
  }
});

router.put("/:id", autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone, is_ativo } = req.body;
    const result = await pool.query(
      "UPDATE cliente SET nome=$1, telefone=$2, is_ativo=$3 WHERE id=$4",
      [nome, telefone, is_ativo, id]
    );
    if (is_ativo === false || is_ativo === 0) {
      await pool.query(
        "UPDATE loja SET is_ativo = false WHERE cliente_id = $1",
        [id]
      );
    }
    if (is_ativo === true || is_ativo === 1) {
      await pool.query(
        "UPDATE loja SET is_ativo = true WHERE cliente_id = $1",
        [id]
      );
    }
    if (result.rowCount) res.json({ id, nome, telefone, is_ativo });
    else res.status(404).json({ error: "Cliente não encontrado" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao atualizar cliente", details: err.message });
  }
});

router.delete("/:id", autenticarToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    await client.query("BEGIN");
    await client.query(
      "UPDATE loja SET funcionario_id = NULL WHERE cliente_id = $1",
      [id]
    );
    await client.query("DELETE FROM loja WHERE cliente_id = $1", [id]);
    const result = await client.query("DELETE FROM cliente WHERE id = $1", [
      id,
    ]);
    await client.query("COMMIT");
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao excluir cliente", details: err.message });
  } finally {
    client.release();
  }
});

export default router;
