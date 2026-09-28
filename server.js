const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database(path.join(__dirname, 'banco.db'), (err) => {
    if (err) return console.error('Erro ao conectar ao banco:', err.message);
    console.log('Conectado com sucesso ao banco.db');
});

db.run(`
    CREATE TABLE IF NOT EXISTS musicas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nomeMusica TEXT NOT NULL,
        artista TEXT NOT NULL,
        dataLancamento TEXT,
        generoMusical TEXT,
        album TEXT,
        duracao TEXT
    )
`);

// Rotas da API
app.get('/api/musicas', (req, res) => {
    db.all('SELECT * FROM musicas ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/musicas/:id', (req, res) => {
    db.get('SELECT * FROM musicas WHERE id = ?', [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Música não encontrada' });
        res.json(row);
    });
});

app.post('/api/musicas', (req, res) => {
    const { nomeMusica, artista, dataLancamento, generoMusical, album, duracao } = req.body;
    if (!nomeMusica || !artista || !dataLancamento) {
        return res.status(400).json({ error: 'Nome, artista e data de lançamento são obrigatórios' });
    }
    const query = `INSERT INTO musicas (nomeMusica, artista, dataLancamento, generoMusical, album, duracao) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(query, [nomeMusica, artista, dataLancamento, generoMusical, album, duracao], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/musicas/:id', (req, res) => {
    const { id } = req.params;
    const { nomeMusica, artista, dataLancamento, generoMusical, album, duracao } = req.body;
    if (!nomeMusica || !artista || !dataLancamento) {
        return res.status(400).json({ error: 'Nome, artista e data de lançamento são obrigatórios' });
    }
    const query = `UPDATE musicas SET nomeMusica = ?, artista = ?, dataLancamento = ?, generoMusical = ?, album = ?, duracao = ? WHERE id = ?`;
    db.run(query, [nomeMusica, artista, dataLancamento, generoMusical, album, duracao, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: 'Música não encontrada' });
        res.json({ updated: this.changes });
    });
});

app.delete('/api/musicas/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM musicas WHERE id = ?', [id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});