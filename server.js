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

app.get('/', (req, res) => {
    const fs = require('fs');
    const arquivos = fs.readdirSync(__dirname);
    const arquivoHTML = arquivos.find(arq => arq.endsWith('.html'));

    if (arquivoHTML) {
        res.sendFile(path.join(__dirname, arquivoHTML));
    } else {
        res.status(404).send('<h1>Erro: Nenhum arquivo .html foi encontrado na sua pasta do projeto!</h1>');
    }
});

    app.get('/api/musicas', (req, res) => {
    db.all('SELECT * FROM musicas', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});


app.post('/api/musicas', (req, res) => {
    const { nomeMusica, artista, dataLancamento, generoMusical, album, duracao } = req.body;
    const query = `INSERT INTO musicas (nomeMusica, artista, dataLancamento, generoMusical, album, duracao) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(query, [nomeMusica, artista, dataLancamento, generoMusical, album, duracao], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID });
    });
});

app.put('/api/musicas/:id', (req, res) => {
    const { id } = req.params;
    const { nomeMusica, artista, dataLancamento, generoMusical, album, duracao } = req.body;
    const query = `UPDATE musicas SET nomeMusica = ?, artista = ?, dataLancamento = ?, generoMusical = ?, album = ?, duracao = ? WHERE id = ?`;

    db.run(query, [nomeMusica, artista, dataLancamento, generoMusical, album, duracao, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Atualizado com sucesso' });
    });
});

app.delete('/api/musicas/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM musicas WHERE id = ?', id, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Removido com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
