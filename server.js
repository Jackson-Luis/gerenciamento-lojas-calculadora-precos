require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT;
const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

// --- CORS CONFIG ---
const cors = require('cors');

// Altere aqui para o domínio correto do seu front-end hospedado
const allowedOrigins = [
  'https://jackson-luis.github.io',
  'http://localhost:8080' // se quiser testar localmente
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());


// --- POSTGRES POOL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// --- AUTH MIDDLEWARE ---
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

// --- LOGIN ---
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const { rows } = await pool.query(
      'SELECT id, nome, email, senha, cargo_superior FROM funcionario WHERE email = $1 LIMIT 1',
      [email]
    );
    if (rows.length > 0) {
      const funcionario = rows[0];
      if (typeof senha === 'string' && typeof funcionario.senha === 'string') {
        const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
        if (senhaCorreta) {
          const user = { id: funcionario.id, nome: funcionario.nome, email: funcionario.email, cargo_superior: funcionario.cargo_superior };
          const token = jwt.sign(user, SECRET, { expiresIn: '1h' });
          return res.json({ token, user });
        }
      }
    }
    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao autenticar', details: err.message });
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

    const { rows } = await pool.query(
      'SELECT senha FROM funcionario WHERE id = $1 LIMIT 1',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const novaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query(
      'UPDATE funcionario SET senha = $1 WHERE id = $2',
      [novaHash, id]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error('Erro em /alterar-senha:', err);
    return res.status(500).json({ error: 'Erro ao alterar senha', details: err.message });
  }
});

// --- CRUD FUNCIONARIO ---
app.get('/funcionarios', autenticarToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix FROM funcionario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funcionários', details: err.message });
  }
});

app.post('/funcionarios', autenticarToken, async (req, res) => {
  try {
    const { nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix } = req.body;
    if (!nome || !email || !senha) return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });

    const { rows: usuarios } = await pool.query('SELECT id FROM funcionario WHERE email = $1', [email]);
    if (usuarios.length > 0) return res.status(400).json({ error: 'Email já está em uso por outro funcionário.' });

    const senhaHash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      'INSERT INTO funcionario (nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [nome, telefone, email, senhaHash, cargo_superior, valor_receber, data_receber_pagamento, chave_pix]
    );
    res.status(201).json({ id: result.rows[0].id, nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar funcionário', details: err.message });
  }
});

app.put('/funcionarios/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone, email, senha, cargo_superior, valor_receber, data_receber_pagamento, chave_pix } = req.body;

    const { rows: usuarios } = await pool.query('SELECT id FROM funcionario WHERE email = $1 AND id != $2', [email, id]);
    if (usuarios.length > 0) return res.status(400).json({ error: 'Email já está em uso por outro funcionário.' });

    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      await pool.query(
        'UPDATE funcionario SET nome=$1, telefone=$2, email=$3, senha=$4, cargo_superior=$5, valor_receber=$6, data_receber_pagamento=$7, chave_pix=$8 WHERE id=$9',
        [nome, telefone, email, senhaHash, cargo_superior, valor_receber, data_receber_pagamento, chave_pix, id]
      );
    } else {
      await pool.query(
        'UPDATE funcionario SET nome=$1, telefone=$2, email=$3, cargo_superior=$4, valor_receber=$5, data_receber_pagamento=$6, chave_pix=$7 WHERE id=$8',
        [nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix, id]
      );
    }

    res.json({ id, nome, telefone, email, cargo_superior, valor_receber, data_receber_pagamento, chave_pix });
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

    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Funcionário não encontrado' });
    }
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
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });
    const result = await pool.query('INSERT INTO cliente (nome, telefone) VALUES ($1, $2) RETURNING id', [nome, telefone]);
    res.status(201).json({ id: result.rows[0].id, nome, telefone });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente', details: err.message });
  }
});

app.put('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone } = req.body;
    const result = await pool.query('UPDATE cliente SET nome=$1, telefone=$2 WHERE id=$3', [nome, telefone, id]);
    if (result.rowCount > 0) {
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

    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
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
        l.id, 
        l.nome, 
        c.nome AS cliente_nome,
        c.id AS cliente_id,
        f.nome AS funcionario_nome,
        f.id AS funcionario_id,
        l.anuncios_total, 
        l.anuncios_realizados, 
        l.anuncios_otimizados, 
        l.visitas_semana, 
        l.produto_mais_visitado, 
        l.vendas_total
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
  try {
    const {
      funcionario_id,
      cliente_id,
      nome,
      anuncios_total,
      anuncios_realizados,
      anuncios_otimizados,
      visitas_semana,
      produto_mais_visitado,
      vendas_total
    } = req.body;
    if (!funcionario_id || !cliente_id || !nome) return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
    const result = await pool.query(
      `INSERT INTO loja (funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total]
    );
    res.status(201).json({ id: result.rows[0].id, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar loja', details: err.message });
  }
});

app.put('/lojas/:id', autenticarToken, async (req, res) => {
  try {
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
      vendas_total
    } = req.body;
    const result = await pool.query(
      `UPDATE loja SET funcionario_id=$1, cliente_id=$2, nome=$3, anuncios_total=$4, anuncios_realizados=$5, anuncios_otimizados=$6, visitas_semana=$7, produto_mais_visitado=$8, vendas_total=$9
       WHERE id=$10`,
      [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total, id]
    );
    if (result.rowCount > 0) {
      res.json({ id, ...req.body });
    } else {
      res.status(404).json({ error: 'Loja não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar loja', details: err.message });
  }
});

app.delete('/lojas/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query('DELETE FROM loja WHERE id=$1', [id]);
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Loja não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir loja', details: err.message });
  }
});

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// --- ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// --- START SERVER ---
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
