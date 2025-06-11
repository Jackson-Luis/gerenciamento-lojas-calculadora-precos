const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// GET all stores
app.get('/lojas', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./db.json'));
  res.json(data);
});

// POST new store
app.post('/lojas', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./db.json'));
  const novaLoja = req.body;
  // Gera novo id incremental
  const maxId = data.length > 0 ? Math.max(...data.map(l => l.id || 0)) : 0;
  novaLoja.id = maxId + 1;
  data.push(novaLoja);
  fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
  res.status(201).json(novaLoja);
});

// PUT update store by index
app.put('/lojas/:index', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./db.json'));
  const index = parseInt(req.params.index, 10);
  if (data[index]) {
    data[index] = req.body;
    fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
    res.json(data[index]);
  } else {
    res.status(404).json({ error: 'Loja não encontrada' });
  }
});

// DELETE store by index
app.delete('/lojas/:index', (req, res) => {
  const data = JSON.parse(fs.readFileSync('./db.json'));
  const index = parseInt(req.params.index, 10);
  if (data[index]) {
    const removido = data.splice(index, 1);
    fs.writeFileSync('./db.json', JSON.stringify(data, null, 2));
    res.json(removido[0]);
  } else {
    res.status(404).json({ error: 'Loja não encontrada' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
