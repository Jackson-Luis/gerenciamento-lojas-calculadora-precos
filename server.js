
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import pkg from 'pg';
const { Pool } = pkg;
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { enviarEmail } from './service/emailService.js';

import OpenAI from 'openai';
dotenv.config();


const app = express();
const port = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY_TESTE,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

app.get('/test-db', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro na conexão', details: err.message });
  }
});


// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  console.log('Tentando login para:', email);

  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, senha, cargo_superior FROM funcionario WHERE email = $1 LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Email não encontrado' });
    }

    const funcionario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    const user = {
      id: funcionario.id,
      nome: funcionario.nome,
      email: funcionario.email,
      cargo_superior: funcionario.cargo_superior
    };

    const SECRET = process.env.JWT_SECRET || 'chave_muito_secreta';
    const token = jwt.sign(user, SECRET, { expiresIn: '1s' });

    return res.json({ token, user });
  } catch (err) {
    console.error('Erro ao autenticar usuário:', err);
    res.status(500).json({ error: 'Erro interno ao autenticar', details: err.message });
  }
});


// --- ALTERAR SENHA ---
app.post('/alterar-senha', autenticarToken, async (req, res) => {
  try {
    const { novaSenha } = req.body;
    if (!novaSenha || novaSenha.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres' });
    }

    const id = req.user.id;
    const senhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query('UPDATE funcionario SET senha = $1 WHERE id = $2', [senhaHash, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao alterar senha', details: err.message });
  }
});

// --- CRUD FUNCIONÁRIO ---
app.get('/funcionarios', autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM funcionario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funcionários', details: err.message });
  }
});

app.post('/funcionarios', autenticarToken, async (req, res) => {
  const { nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix } = req.body;
  try {
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

    const { rows: existentes } = await pool.query('SELECT id FROM funcionario WHERE email = $1', [email]);
    if (existentes.length) return res.status(400).json({ error: 'Email já está em uso por outro funcionário.' });

    const senhaHash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      `INSERT INTO funcionario (nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [nome, telefone, email, senhaHash, cargo_superior, valor_receber, data_receber_pagamento, chave_pix]
    );
    res.status(201).json({ id: rows[0].id, nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar funcionário', details: err.message });
  }
});

app.put('/funcionarios/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix } = req.body;
  try {
    if (!nome || !email) return res.status(400).json({ error: 'Nome e email são obrigatórios' });
    const { rows: existentes } = await pool.query('SELECT id FROM funcionario WHERE email = $1 AND id != $2', [email, id]);
    if (existentes.length) return res.status(400).json({ error: 'Email já está em uso por outro funcionário.' });
    let senhaHash = null;
    if (senha) {
      senhaHash = await bcrypt.hash(senha, 10);
      await pool.query('UPDATE funcionario SET senha = $1 WHERE id = $2', [senhaHash, id]);
    }
    const result = await pool.query(
      `UPDATE funcionario SET nome = $1, telefone = $2, email = $3
        , cargo_superior = $4, valor_receber = $5, data_receber_pagamento = $6, chave_pix = $7
        WHERE id = $8`,
      [nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix, id]
    );
    if (result.rowCount) {
      res.json({ id, nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix });
    } else {
      res.status(404).json({ error: 'Funcionário não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar funcionário', details: err.message });
  }
});

app.delete('/funcionarios/:id', autenticarToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    await client.query('BEGIN');
    await client.query('UPDATE loja SET funcionario_id = NULL WHERE funcionario_id = $1', [id]);
    const result = await client.query('DELETE FROM funcionario WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao excluir funcionário', details: err.message });
  } finally {
    client.release();
  }
});

// --- CRUD CLIENTE ---
app.get('/clientes', autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cliente');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes', details: err.message });
  }
});

app.post('/clientes', autenticarToken, async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    const result = await pool.query(
      'INSERT INTO cliente (nome, telefone) VALUES ($1, $2) RETURNING id',
      [nome, telefone]
    );
    res.status(201).json({ id: result.rows[0].id, nome, telefone });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente', details: err.message });
  }
});

app.put('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone } = req.body;
    const result = await pool.query(
      'UPDATE cliente SET nome=$1, telefone=$2 WHERE id=$3',
      [nome, telefone, id]
    );
    if (result.rowCount) {
      res.json({ id, nome, telefone });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente', details: err.message });
  }
});

app.delete('/clientes/:id', autenticarToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const id = parseInt(req.params.id, 10);
    await client.query('BEGIN');
    await client.query('UPDATE loja SET funcionario_id = NULL WHERE cliente_id = $1', [id]);
    await client.query('DELETE FROM loja WHERE cliente_id = $1', [id]);
    const result = await client.query('DELETE FROM cliente WHERE id = $1', [id]);
    await client.query('COMMIT');
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Erro ao excluir cliente', details: err.message });
  } finally {
    client.release();
  }
});

// --- CRUD LOJA ---
app.get('/lojas', autenticarToken, async (req, res) => {
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
    res.status(500).json({ error: 'Erro ao buscar lojas', details: err.message });
  }
});

app.post('/lojas', autenticarToken, async (req, res) => {
  const {
    funcionario_id, cliente_id, nome,
    anuncios_total, anuncios_realizados, anuncios_otimizados,
    visitas_semana, produto_mais_visitado, vendas_total
  } = req.body;
  try {
    const result = await pool.query(`
      INSERT INTO loja (funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
    `, [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total]);
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar loja', details: err.message });
  }
});

app.put('/lojas/:id', autenticarToken, async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const {
    funcionario_id, cliente_id, nome,
    anuncios_total, anuncios_realizados, anuncios_otimizados,
    visitas_semana, produto_mais_visitado, vendas_total
  } = req.body;
  try {
    const result = await pool.query(`
      UPDATE loja SET funcionario_id=$1, cliente_id=$2, nome=$3, anuncios_total=$4, anuncios_realizados=$5, anuncios_otimizados=$6, visitas_semana=$7, produto_mais_visitado=$8, vendas_total=$9 WHERE id=$10
    `, [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total, id]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar loja', details: err.message });
  }
});

app.delete('/lojas/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query('DELETE FROM loja WHERE id=$1', [id]);
    res.json({ success: result.rowCount > 0 });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir loja', details: err.message });
  }
});

app.post('/api/cadastrar', async (req, res) => {
  const { nome, email } = req.body

  await enviarEmail(email, nome)

  res.json({ ok: true, message: 'Cadastro completo e e-mail enviado!' })
})

app.post('/enviar-email', async (req, res) => {
  try {
    const { html, para } = req.body;

    if (!para || !html) {
      return res.status(400).json({ ok: false, message: 'Parâmetros "para" e "html" são obrigatórios.' });
    }

    await enviarEmail(para, html);

    res.json({ ok: true, message: 'E-mail enviado!' });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    res.status(500).json({ ok: false, message: 'Erro ao enviar e-mail.' });
  }
});

app.get('/verificar-email', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ exists: false, message: 'E-mail não fornecido.' });
  }
  try {
    const { rows } = await pool.query('SELECT id FROM funcionario WHERE email = $1', [email]);
    res.json({ exists: rows.length > 0 });
  } catch (err) {
    console.error('Erro ao verificar e-mail:', err);
    res.status(500).json({ exists: false, message: 'Erro ao verificar e-mail.' });
  }
});


app.post('/api/preencher', async (req, res) => {
  const { prompt } = req.body;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-nano-2025-04-14",
      messages: [
        {
          role: 'user',
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

    const texto = completion.choices[0].message.content;
    const jsonLimpo = texto
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim();

    const json = JSON.parse(jsonLimpo);
    res.json(json);
  } catch (err) {
    console.error('Erro ao fazer parse do JSON:', err.message);
    // eslint-disable-next-line no-undef
    console.log('Conteúdo retornado:', completion.choices[0].message.content);
    res.status(500).json({ error: 'Erro ao interpretar JSON retornado pela IA.' });
  }
});



app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use((err, req, res) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
