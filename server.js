require('dotenv').config()
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3001;

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

// GET all stores
app.get('/lojas', async (req, res) => {
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
app.post('/lojas', async (req, res) => {
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
app.put('/lojas/:id', async (req, res) => {
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
app.delete('/lojas/:id', async (req, res) => {
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
    const { nome, telefone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO funcionario (nome, telefone) VALUES (?, ?)',
      [nome, telefone]
    );
    res.status(201).json({ id: result.insertId, nome, telefone });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao criar funcionário', details: err });
  }
});

app.put('/funcionarios/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { nome, telefone } = req.body;
    const [result] = await pool.query(
      'UPDATE funcionario SET nome=?, telefone=? WHERE id=?',
      [nome, telefone, id]
    );
    if (result.affectedRows) {
      res.json({ id, nome, telefone });
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
app.get('/clientes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cliente');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar clientes', details: err });
  }
});

app.post('/clientes', async (req, res) => {
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

app.put('/clientes/:id', async (req, res) => {
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

app.delete('/clientes/:id', async (req, res) => {
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
