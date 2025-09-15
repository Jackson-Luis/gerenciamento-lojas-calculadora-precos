import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { enviarEmail } from "./service/emailService.js";
import OpenAI from "openai";
import cron from "node-cron";
import aws4 from "aws4"; // <- necessário para assinatura SigV4
import fetch from "node-fetch"; // <- para compatibilidade (Node < 18)

dotenv.config();

const app = express();
// const port = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || "chave_muito_secreta";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY_TESTE });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

app.use(
  cors({
    origin: [
      "https://jackson-luis.github.io",
      "https://gerenciamento-lojas-calculadora-precos.onrender.com", // se consumir a si mesmo
      "http://localhost:8080",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

cron.schedule("*/4 * * * *", async () => {
  try {
    const response = await fetch(
      "https://gerenciamento-lojas-calculadora-precos.onrender.com/test-db"
    );
    console.log(`Ping enviado. Status: ${response.status}`);
  } catch (error) {
    console.error("Erro ao pingar o servidor:", error.message);
  }
});

app.get("/test-db", (req, res) => {
  try {
    res.json({
      message: "Servidor ativo",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: "Falha no ping", details: err.message });
  }
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, senha } = req.body;
  console.log("Tentando login para:", email);

  try {
    const { rows } = await pool.query(
      "SELECT id, nome, email, senha, cargo_superior, relatorio_liberado, calculadora_liberada, administrador_geral FROM funcionario WHERE email = $1 LIMIT 1",
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
      cargo_superior: funcionario.cargo_superior,
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

// --- ALTERAR SENHA ---
app.post("/alterar-senha", autenticarToken, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 6) {
      return res
        .status(400)
        .json({ error: "A nova senha deve ter pelo menos 6 caracteres" });
    }

    const id = req.user.id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query("UPDATE funcionario SET senha = $1 WHERE id = $2", [
      senhaHash,
      id,
    ]);
    res.json({ success: true });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao alterar senha", details: err.message });
  }
});

// --- CRUD FUNCIONÁRIO ---
app.get("/funcionarios", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM funcionario");
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao buscar funcionários", details: err.message });
  }
});

app.post("/funcionarios", autenticarToken, async (req, res) => {
  const {
    nome,
    telefone,
    email,
    senha,
    cargo_superior,
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
      `INSERT INTO funcionario (nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix, relatorio_liberado, calculadora_liberada, administrador_geral, is_ativo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
      [
        nome,
        telefone,
        email,
        senhaHash,
        cargo_superior,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
      ]
    );
    res.status(201).json({
      id: rows[0].id,
      nome,
      telefone,
      email,
      cargo_superior,
      valor_receber,
      data_receber_pagamento,
      chave_pix,
      relatorio_liberado,
      calculadora_liberada,
      administrador_geral,
      is_ativo,
    });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao criar funcionário", details: err.message });
  }
});

app.put("/funcionarios/:id", autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    nome,
    telefone,
    email,
    senha,
    cargo_superior,
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
    let senhaHash = null;
    if (senha) {
      senhaHash = await bcrypt.hash(senha, 10);
      await pool.query("UPDATE funcionario SET senha = $1 WHERE id = $2", [
        senhaHash,
        id,
      ]);
    }
    const result = await pool.query(
      `UPDATE funcionario SET nome = $1, telefone = $2, email = $3,
        cargo_superior = $4, valor_receber = $5, data_receber_pagamento = $6, chave_pix = $7,
        relatorio_liberado = $8, calculadora_liberada = $9, administrador_geral = $10, is_ativo = $11
        WHERE id = $12`,
      [
        nome,
        telefone,
        email,
        cargo_superior,
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
    if (result.rowCount) {
      res.json({
        id,
        nome,
        telefone,
        email,
        cargo_superior,
        valor_receber,
        data_receber_pagamento,
        chave_pix,
        relatorio_liberado,
        calculadora_liberada,
        administrador_geral,
        is_ativo,
      });
    } else {
      res.status(404).json({ error: "Funcionário não encontrado" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao atualizar funcionário", details: err.message });
  }
});

app.delete("/funcionarios/:id", autenticarToken, async (req, res) => {
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
    res
      .status(500)
      .json({ error: "Erro ao excluir funcionário", details: err.message });
  } finally {
    client.release();
  }
});

// --- CRUD CLIENTE ---
app.get("/clientes", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM cliente");
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao buscar clientes", details: err.message });
  }
});

app.post("/clientes", autenticarToken, async (req, res) => {
  try {
    const { nome, telefone, is_ativo } = req.body;
    const result = await pool.query(
      "INSERT INTO cliente (nome, telefone, is_ativo) VALUES ($1, $2, $3) RETURNING id",
      [nome, telefone, is_ativo]
    );
    res.status(201).json({ id: result.rows[0].id, nome, telefone, is_ativo });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao criar cliente", details: err.message });
  }
});

app.put("/clientes/:id", autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone, is_ativo } = req.body;
    const result = await pool.query(
      "UPDATE cliente SET nome=$1, telefone=$2, is_ativo=$3 WHERE id=$4",
      [nome, telefone, is_ativo, id]
    );
    if (result.rowCount) {
      res.json({ id, nome, telefone });
    } else {
      res.status(404).json({ error: "Cliente não encontrado" });
    }
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao atualizar cliente", details: err.message });
  }
});

app.delete("/clientes/:id", autenticarToken, async (req, res) => {
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
    res
      .status(500)
      .json({ error: "Erro ao excluir cliente", details: err.message });
  } finally {
    client.release();
  }
});

// --- CRUD LOJA ---
app.get("/lojas", autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        l.*, c.nome AS cliente_nome, f.nome AS funcionario_nome
      FROM loja l
      JOIN cliente c ON l.cliente_id = c.id
      JOIN funcionario f ON l.funcionario_id = f.id
    `);
    res.json(rows);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao buscar lojas", details: err.message });
  }
});

app.post("/lojas", autenticarToken, async (req, res) => {
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
      `
      INSERT INTO loja (funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total, is_ativo)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id
    `,
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
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar loja", details: err.message });
  }
});

app.put("/lojas/:id", autenticarToken, async (req, res) => {
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
      `
      UPDATE loja SET funcionario_id=$1, cliente_id=$2, nome=$3, anuncios_total=$4, anuncios_realizados=$5, anuncios_otimizados=$6, visitas_semana=$7, produto_mais_visitado=$8, vendas_total=$9, is_ativo=$10 WHERE id=$11
    `,
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
    res
      .status(500)
      .json({ error: "Erro ao atualizar loja", details: err.message });
  }
});

app.delete("/lojas/:id", autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query("DELETE FROM loja WHERE id=$1", [id]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Erro ao excluir loja", details: err.message });
  }
});

app.post("/api/cadastrar", async (req, res) => {
  const { nome, email } = req.body;
  await enviarEmail(email, nome);
  res.json({ ok: true, message: "Cadastro completo e e-mail enviado!" });
});

app.post("/enviar-email", async (req, res) => {
  try {
    const { html, para } = req.body;

    if (!para || !html) {
      return res.status(400).json({
        ok: false,
        message: 'Parâmetros "para" e "html" são obrigatórios.',
      });
    }

    await enviarEmail({ to: para, html });
    res.json({ ok: true, message: "E-mail enviado!" });
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    res.status(500).json({ ok: false, message: "Erro ao enviar e-mail." });
  }
});

app.get("/verificar-email", async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res
      .status(400)
      .json({ exists: false, message: "E-mail não fornecido." });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id FROM funcionario WHERE email = $1",
      [email]
    );
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error("Erro ao verificar e-mail:", err);
    res
      .status(500)
      .json({ exists: false, message: "Erro ao verificar e-mail." });
  }
});

/**
 * /api/preencher — gera conteúdo de listagem via IA (JSON)
 * Mantém a estrutura original, porém com try/catch mais robusto
 * e sem referência a variável "completion" fora do escopo.
 */
app.post("/api/preencher", async (req, res) => {
  const { prompt } = req.body;
  let texto = "";
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: "user",
          content: `Com base nesse prompt: produto ["${prompt}"]
                  tarefas:
                  1. pesquise as palavras chave mais relevantes na busca do produto e as cite espaçadas por (;) e que seja no máximo 500 caracteres
                  2. crie um titulo para anuncios, utilizando apenas as palavras chave com o limite minimo de 130 caracteres cada
                  3. crie uma descrição com cerca de 120 palavras, lembre de ser convincente e incluir as especificações do produto
                  4. crie 5 bullet points sofisticados para cada anuncio
                  observações
                  * Utilize linguagem persuasiva e focada em SEO.
                  * Adapte o tom de voz e a linguagem ao público-alvo do produto.
                  * Mantenha a formatação clara e organizada para facilitar a leitura e a aplicação das informações.
                  * gere em formato JSON, com os campos: "palavras_chave", "titulos", "descricoes", "bullet_points"
                  * dentro de bullet_points, deve ter 5 bullet points distintos no máximo
                  * em bulletpoints deve ser também um objeto com cada como bulletpoint_1, e o valor como o bullet point e assim por diante`,
        },
      ],
    });

    texto = completion.choices[0]?.message?.content || "";
    const jsonLimpo = String(texto)
      .replace(/^```json\s*/i, "")
      .replace(/```$/, "")
      .trim();

    const json = JSON.parse(jsonLimpo);
    res.json(json);
  } catch (err) {
    console.error("Erro ao fazer parse do JSON:", err.message);
    res.status(500).json({
      error: "Erro ao interpretar JSON retornado pela IA.",
      raw: texto,
    });
  }
});

///////////// TESTE SANDBOX PARA ACESSO Á AMAZON

// === Helpers de ambiente ===
const REGION_GROUP = process.env.SPAPI_REGION_GROUP || "na"; // na | eu | fe  -> BR = na
const AWS_REGION = process.env.SPAPI_AWS_REGION || "us-east-1"; // BR = us-east-1
const USE_SANDBOX_ENV = String(process.env.USE_SANDBOX || "false") === "true";

// host por group
const HOSTS = {
  na: "sellingpartnerapi-na.amazon.com",
  eu: "sellingpartnerapi-eu.amazon.com",
  fe: "sellingpartnerapi-fe.amazon.com",
};

function hostBySandbox(useSandbox) {
  const base = HOSTS[REGION_GROUP] || HOSTS.na;
  const effectiveSandbox =
    typeof useSandbox === "boolean" ? useSandbox : USE_SANDBOX_ENV;
  return effectiveSandbox ? `sandbox.${base}` : base;
}

// === LWA TOKENS ===
async function getGrantlessAccessToken(
  scopes = ["sellingpartnerapi::notifications"]
) {
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", process.env.LWA_CLIENT_ID);
  params.append("client_secret", process.env.LWA_CLIENT_SECRET);
  params.append("scope", scopes.join(" "));

  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `LWA client_credentials falhou: ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data.access_token; // ~1h
}

async function getAccessTokenWithRefresh() {
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", process.env.LWA_REFRESH_TOKEN);
  params.append("client_id", process.env.LWA_CLIENT_ID);
  params.append("client_secret", process.env.LWA_CLIENT_SECRET);

  const res = await fetch("https://api.amazon.com/auth/o2/token", {
    method: "POST",
    body: params,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `LWA refresh_token falhou: ${res.status} ${JSON.stringify(data)}`
    );
  }
  return data.access_token; // ~1h
}

// === Assinar e chamar SP-API ===
async function spApiFetch({
  path,
  method = "GET",
  query = "",
  body = null,
  accessToken,
  useSandbox,
}) {
  const host = hostBySandbox(useSandbox);
  const urlPath = query ? `${path}?${query}` : path;
  console.log("Host:", host);
  const request = {
    host,
    path: urlPath,
    method,
    service: "execute-api",
    region: AWS_REGION,
    headers: {
      host,
      "content-type": "application/json",
      "x-amz-access-token": accessToken,
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  aws4.sign(request, {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    // sessionToken: process.env.AWS_SESSION_TOKEN, // se usar STS
  });

  const url = `https://${host}${urlPath}`;
  const resp = await fetch(url, {
    method,
    headers: request.headers,
    body: request.body,
  });

  const text = await resp.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!resp.ok) {
    throw new Error(`SP-API erro ${resp.status}: ${text}`);
  }
  return json;
}

// === Util: mesmo "content" do /api/preencher ===
async function gerarConteudoIAComMesmoMolde(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4.1-nano-2025-04-14",
    messages: [
      {
        role: "user",
        content: `Com base nesse prompt: produto ["${prompt}"]
                tarefas:
                1. pesquise as palavras chave mais relevantes na busca do produto e as cite espaçadas por (;) e que seja no máximo 500 caracteres
                2. crie um titulo para anuncios, utilizando apenas as palavras chave com o limite minimo de 130 caracteres cada
                3. crie uma descrição com cerca de 120 palavras, lembre de ser convincente e incluir as especificações do produto
                4. crie 5 bullet points sofisticados para cada anuncio
                observações
                * Utilize linguagem persuasiva e focada em SEO.
                * Adapte o tom de voz e a linguagem ao público-alvo do produto.
                * Mantenha a formatação clara e organizada para facilitar a leitura e a aplicação das informações.
                * gere em formato JSON, com os campos: "palavras_chave", "titulos", "descricoes", "bullet_points"
                * dentro de bullet_points, deve ter 5 bullet points distintos no máximo
                * em bulletpoints deve ser também um objeto com cada como bulletpoint_1, e o valor como o bullet point e assim por diante`,
      },
    ],
  });

  const bruto = completion.choices[0]?.message?.content || "";
  const limpo = String(bruto)
    .replace(/^```json\s*/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(limpo);
}

// === 4) Endpoint: IA gera JSON (mantido, mas usando o helper) ===
app.post("/api/ia/generate", async (req, res) => {
  const { productPrompt } = req.body || {};
  if (!productPrompt)
    return res.status(400).json({ error: "productPrompt é obrigatório" });

  try {
    const json = await gerarConteudoIAComMesmoMolde(productPrompt);
    res.json({ ok: true, ia: json });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Falha ao gerar JSON da IA", detail: err.message });
  }
});

// === 5) Endpoint sandbox-check (grantless + IA) — mantém a ideia e melhora ===
app.post("/api/ia/sandbox-check", async (req, res) => {
  const { productPrompt } = req.body || {};
  if (!productPrompt)
    return res.status(400).json({ error: "productPrompt é obrigatório" });

  try {
    const iaJson = await gerarConteudoIAComMesmoMolde(productPrompt);

    const keywords = (iaJson.palavras_chave || "")
      .split(/[;,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const title = iaJson.titulos || "";
    const description = iaJson.descricoes || "";
    const bullets = Object.values(iaJson.bullet_points || {}).filter(Boolean);

    // Grantless em SANDBOX: notifications
    const accessToken = await getGrantlessAccessToken([
      "sellingpartnerapi::notifications",
    ]);
    const notifResp = await spApiFetch({
      path: "/notifications/v1/destinations",
      method: "GET",
      accessToken,
      useSandbox: true,
    });

    res.json({
      ok: true,
      ia_mapped: { title, description, bullets, keywords },
      spapi_check: notifResp,
      note: "Fluxo grantless SANDBOX OK.",
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Falha no sandbox-check", detail: err.message });
  }
});

// === NOVAS ROTAS SOLICITADAS ===

// 6) SANDBOX — processa conteúdo IA e valida SP-API (grantless)
app.post("/api/amazon/sandbox/process", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt é obrigatório" });

  try {
    const iaJson = await gerarConteudoIAComMesmoMolde(prompt);
    const accessToken = await getGrantlessAccessToken([
      "sellingpartnerapi::notifications",
    ]);

    // Exemplo de chamada segura no sandbox
    const sp = await spApiFetch({
      path: "/notifications/v1/destinations",
      method: "GET",
      accessToken,
      useSandbox: true,
    });

    res.json({ ok: true, environment: "SANDBOX", ia: iaJson, spapi_check: sp });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Falha em /api/amazon/sandbox/process",
      detail: err.message,
    });
  }
});

// 7) PRODUÇÃO — processa conteúdo IA e valida SP-API (autorizado via refresh_token)
app.post("/api/amazon/prod/process", async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt) return res.status(400).json({ error: "prompt é obrigatório" });

  try {
    const iaJson = await gerarConteudoIAComMesmoMolde(prompt);
    console.log(await gerarConteudoIAComMesmoMolde(prompt));
    const accessToken = await getAccessTokenWithRefresh();

    // Exemplo seguro em produção: sellers participations (autorizado)
    const sellers = await spApiFetch({
      path: "/sellers/v1/marketplaceParticipations",
      method: "GET",
      accessToken,
      useSandbox: false,
    });

    res.json({
      ok: true,
      environment: "PRODUCTION",
      ia: iaJson,
      spapi_check: sellers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Falha em /api/amazon/prod/process",
      detail: err.message,
    });
  }
});

app.get("/callback", async (req, res) => {
  const authCode = req.query.code;

  if (!authCode) {
    return res.status(400).send("Nenhum code retornado pela Amazon.");
  }

  try {
    const response = await fetch("https://api.amazon.com/auth/o2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: authCode,
        client_id: process.env.LWA_CLIENT_ID,
        client_secret: process.env.LWA_CLIENT_SECRET,
        redirect_uri:
          "https://gerenciamento-lojas-calculadora-precos.onrender.com/callback",
      }),
    });

    const data = await response.json();

    // Aqui você salva o refresh_token retornado
    const refreshToken = data.refresh_token;

    res.send("Refresh Token gerado: " + refreshToken);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send("Erro ao trocar o code pelo token.");
  }
});

// rota temporária só p/ diagnóstico
app.get("/diag/spapi-grantless-prod", async (req, res) => {
  try {
    const accessToken = await getGrantlessAccessToken([
      "sellingpartnerapi::notifications",
    ]);
    const r = await spApiFetch({
      path: "/notifications/v1/destinations",
      method: "GET",
      accessToken,
      useSandbox: false,
    });
    res.json({ ok: true, r });
  } catch (e) {
    res.status(500).json({ ok: false, detail: String(e.message || e) });
  }
});

// === 8) Consultar estoque via Inventory API ===
app.get("/api/amazon/inventory", async (req, res) => {
  try {
    const accessToken = await getAccessTokenWithRefresh();
    console.log(accessToken);
    const result = await spApiFetch({
      path: "/fba/inventory/v1/summaries",
      method: "GET",
      query: "details=true&marketplaceIds=A2Q3Y263D00KWC", // BR marketplace
      accessToken,
      useSandbox: false,
    });
    res.json({ ok: true, inventory: result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao consultar estoque", detail: err.message });
  }
});

// === 9) Criar solicitação de relatório de anúncios ===
app.post("/api/amazon/reports/create", async (req, res) => {
  try {
    const accessToken = await getAccessTokenWithRefresh();
    const body = {
      reportType: "GET_FLAT_FILE_OPEN_LISTINGS_DATA",
      marketplaceIds: ["A2Q3Y263D00KWC"], // Brasil
    };

    const result = await spApiFetch({
      path: "/reports/2021-06-30/reports",
      method: "POST",
      body,
      accessToken,
      useSandbox: false,
    });

    res.json({ ok: true, reportRequest: result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao criar relatório", detail: err.message });
  }
});

// === 10) Consultar status do relatório por reportId ===
app.get("/api/amazon/reports/:reportId", async (req, res) => {
  try {
    const accessToken = await getAccessTokenWithRefresh();
    const { reportId } = req.params;

    const result = await spApiFetch({
      path: `/reports/2021-06-30/reports/${reportId}`,
      method: "GET",
      accessToken,
      useSandbox: false,
    });

    res.json({ ok: true, reportStatus: result });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao consultar relatório", detail: err.message });
  }
});

// === 11) Baixar conteúdo do relatório ===
app.get("/api/amazon/reports/download/:reportDocumentId", async (req, res) => {
  try {
    const accessToken = await getAccessTokenWithRefresh();
    const { reportDocumentId } = req.params;

    const docMeta = await spApiFetch({
      path: `/reports/2021-06-30/documents/${reportDocumentId}`,
      method: "GET",
      accessToken,
      useSandbox: false,
    });

    // Baixar o CSV da URL fornecida pela Amazon
    const csvResp = await fetch(docMeta.url);
    const csvText = await csvResp.text();

    res.type("text/plain").send(csvText);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Erro ao baixar relatório", detail: err.message });
  }
});

//////////////////////////////

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Middleware de erro (assinatura correta)
app.use((err, req, res) => {
  console.error("Erro não tratado:", err);
  res.status(500).json({ error: "Erro interno do servidor" });
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 3001}`);
});
