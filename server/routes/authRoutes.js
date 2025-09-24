// routes/authRoutes.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { pool } from "../config/db.js";
import { autenticarToken } from "../middlewares/auth.js";
dotenv.config();
const SECRET = process.env.JWT_SECRET || "chave_muito_secreta";

const router = express.Router();

// login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  console.log("Tentando login para:", email);

  try {
    const { rows } = await pool.query(
      "SELECT id, nome, email, senha, relatorio_liberado, calculadora_liberada, administrador_geral FROM funcionario WHERE email = $1 LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "E-mail ou Senha incorreta" });
    }

    const funcionario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "E-mail ou Senha incorreta" });
    }
    // if (!funcionario.is_ativo) {
    //   return res.status(403).json({ error: "E-mail ou Senha incorreta" });
    // }

    const user = {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      relatorio_liberado: funcionario.relatorio_liberado,
      calculadora_liberada: funcionario.calculadora_liberada,
      administrador_geral: funcionario.administrador_geral,
    };

    const token = jwt.sign(user, SECRET, { expiresIn: "1h" });

    return res.json({ token, user });
  } catch (err) {
    console.error("Erro ao autenticar usuário:", err);
    res
      .status(500)
      .json({ error: "Erro interno ao autenticar", details: err.message });
  }
});

// alterar senha
router.post("/alterar-senha", autenticarToken, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 6)
      return res
        .status(400)
        .json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query("UPDATE funcionario SET senha = $1 WHERE id = $2", [
      senhaHash,
      req.user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao alterar senha", details: err.message });
  }
});

export default router;
