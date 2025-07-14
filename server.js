require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 3001;
const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

app.use(cors());
app.use(express.json());

// Configuração da conexão MySQL
const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: Number(process.env.MYSQLPORT),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para proteger rotas
function autenticarToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  // Permite o token de homologação em dev
  if (
    process.env.NODE_ENV !== 'production' &&
    token === 'homolog-token'
  ) {
    req.user = { id: 0, nome: 'Admin', email: 'admin@email.com' };
    return next();
  }
  // if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, SECRET, (err, user) => {
    // if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

// Rota de login usando tabela funcionario (com bcrypt)
app.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  // Login de homologação apenas em ambiente de desenvolvimento
  if (
    process.env.NODE_ENV !== 'production' &&
    email === 'admin@email.com' &&
    senha === 'admin'
  ) {
    // Simula um usuário admin
    const user = { id: 0, nome: 'Admin', email: 'admin@email.com' };
    const token = jwt.sign(user, SECRET, { expiresIn: '1h' });
    return res.json({ token, user });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha FROM funcionario WHERE email = ? LIMIT 1',
      [email]
    );
    if (rows.length > 0) {
      const funcionario = rows[0];
      const senhaCorreta = await bcrypt.compare(senha, funcionario.senha);
      if (senhaCorreta) {
        const user = { id: funcionario.id, nome: funcionario.nome, email: funcionario.email };
        const token = jwt.sign(user, SECRET, { expiresIn: '1h' });
        return res.json({ token, user });
      }
    }
    res.status(401).json({ error: 'Credenciais inválidas' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao autenticar', details: err });
  }
});

// GET all stores
app.get('/lojas', autenticarToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
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
    res.status(500).json({ error: 'Erro ao buscar lojas', details: err });
  }
});

// POST new store
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

    const [result] = await pool.query(
      `INSERT INTO loja (funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar loja', details: err });
  }
});

// PUT update store by id
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

    const [result] = await pool.query(
      `UPDATE loja SET funcionario_id=?, cliente_id=?, nome=?, anuncios_total=?, anuncios_realizados=?, anuncios_otimizados=?, visitas_semana=?, produto_mais_visitado=?, vendas_total=?
       WHERE id=?`,
      [funcionario_id, cliente_id, nome, anuncios_total, anuncios_realizados, anuncios_otimizados, visitas_semana, produto_mais_visitado, vendas_total, id]
    );
    if (result.affectedRows) {
      res.json({ id, ...req.body });
    } else {
      res.status(404).json({ error: 'Loja não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar loja', details: err });
  }
});

// DELETE store by id
app.delete('/lojas/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('DELETE FROM loja WHERE id=?', [id]);
    if (result.affectedRows) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Loja não encontrada' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir loja', details: err });
  }
});

// CRUD FUNCIONARIO
app.get('/funcionarios', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM funcionario');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar funcionários', details: err });
  }
});

app.post('/funcionarios', async (req, res) => {
  try {
    const { nome, telefone, email, senha } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10);
    const [result] = await pool.query(
      'INSERT INTO funcionario (nome, telefone, email, senha) VALUES (?, ?, ?, ?)',
      [nome, telefone, email, senhaHash]
    );
    res.status(201).json({ id: result.insertId, nome, telefone, email });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar funcionário', details: err });
  }
});

app.put('/funcionarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone, email, senha } = req.body;
    let query, params;
    if (senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      query = 'UPDATE funcionario SET nome=?, telefone=?, email=?, senha=? WHERE id=?';
      params = [nome, telefone, email, senhaHash, id];
    } else {
      query = 'UPDATE funcionario SET nome=?, telefone=?, email=? WHERE id=?';
      params = [nome, telefone, email, id];
    }
    const [result] = await pool.query(query, params);
    if (result.affectedRows) {
      res.json({ id, nome, telefone, email });
    } else {
      res.status(404).json({ error: 'Funcionário não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar funcionário', details: err });
  }
});

app.delete('/funcionarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('DELETE FROM funcionario WHERE id=?', [id]);
    if (result.affectedRows) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Funcionário não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir funcionário', details: err });
  }
});

// CRUD CLIENTE
app.get('/clientes', autenticarToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes', details: err });
  }
});

app.post('/clientes', autenticarToken, async (req, res) => {
  try {
    const { nome, telefone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO cliente (nome, telefone) VALUES (?, ?)',
      [nome, telefone]
    );
    res.status(201).json({ id: result.insertId, nome, telefone });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar cliente', details: err });
  }
});

app.put('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone } = req.body;
    const [result] = await pool.query(
      'UPDATE cliente SET nome=?, telefone=? WHERE id=?',
      [nome, telefone, id]
    );
    if (result.affectedRows) {
      res.json({ id, nome, telefone });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar cliente', details: err });
  }
});

app.delete('/clientes/:id', autenticarToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const [result] = await pool.query('DELETE FROM cliente WHERE id=?', [id]);
    if (result.affectedRows) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Cliente não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir cliente', details: err });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
