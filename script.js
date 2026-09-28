document.addEventListener('DOMContentLoaded', () => {
    let bibliotecaMusicas = [];

    const form = document.getElementById('cadastroMusicaForm');
    const formTitle = document.getElementById('form-title');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancel = document.getElementById('btn-cancel');
    const editIndexInput = document.getElementById('edit-index');
    const tabelaCorpo = document.querySelector('#tabelaMusicas tbody');
    const dashTotalMusicas = document.getElementById('dashTotalMusicas');
    const dashTotalArtistas = document.getElementById('dashTotalArtistas');
    const dashTotalGeneros = document.getElementById('dashTotalGeneros');
    const generoChartContainer = document.getElementById('generoChartContainer');
    const listaRecentes = document.getElementById('listaRecentes');

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatarData(data) {
        if (!data) return '---';
        const partes = String(data).split('-');
        if (partes.length === 3) return partes.reverse().join('/');
        return data;
    }

    async function carregarMusicasDoBanco() {
        try {
            const response = await fetch('/api/musicas');
            if (!response.ok) throw new Error('Erro na resposta do servidor');
            bibliotecaMusicas = await response.json();
            renderizarInterface();
            aplicarModoEdicaoDaUrl();
        } catch (error) {
            console.error('Erro ao buscar músicas do banco:', error);
            mostrarErroCarregamento();
        }
    }

    function mostrarErroCarregamento() {
        if (tabelaCorpo) {
            tabelaCorpo.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center;">
                        Não foi possível carregar as músicas. Confirme se o servidor está rodando.
                    </td>
                </tr>`;
        }
        if (generoChartContainer) {
            generoChartContainer.innerHTML = '<p class="description">Não foi possível carregar o dashboard. Inicie o servidor com <code>npm start</code>.</p>';
        }
    }

    function renderizarGraficoGeneros() {
        if (!generoChartContainer) return;
        generoChartContainer.innerHTML = '';

        if (bibliotecaMusicas.length === 0) {
            generoChartContainer.innerHTML = '<p class="description">Sem dados para exibir. Cadastre músicas para ver o gráfico.</p>';
            return;
        }

        const contagemGeneros = {};
        bibliotecaMusicas.forEach((m) => {
            const genero = m.generoMusical || 'Não Definido';
            contagemGeneros[genero] = (contagemGeneros[genero] || 0) + 1;
        });

        const total = bibliotecaMusicas.length;
        const maxQtd = Math.max(...Object.values(contagemGeneros));

        Object.entries(contagemGeneros)
            .sort((a, b) => b[1] - a[1])
            .forEach(([genero, qtd]) => {
                const percentual = Math.round((qtd / total) * 100);
                const largura = Math.max(8, Math.round((qtd / maxQtd) * 100));

                const row = document.createElement('div');
                row.className = 'chart-row';
                row.innerHTML = `
                    <div class="chart-row-info">
                        <span>${escapeHTML(genero)}</span>
                        <span>${qtd} (${percentual}%)</span>
                    </div>
                    <div class="chart-bar-bg">
                        <div class="chart-bar-fill" style="width: ${largura}%"></div>
                    </div>
                `;
                generoChartContainer.appendChild(row);
            });
    }

    function renderizarDashboard() {
        if (dashTotalMusicas) {
            dashTotalMusicas.textContent = String(bibliotecaMusicas.length);
        }

        if (dashTotalArtistas) {
            const artistas = new Set(
                bibliotecaMusicas
                    .map((m) => (m.artista || '').trim().toLowerCase())
                    .filter(Boolean)
            );
            dashTotalArtistas.textContent = String(artistas.size);
        }

        if (dashTotalGeneros) {
            const generos = new Set(
                bibliotecaMusicas
                    .map((m) => m.generoMusical || 'Não Definido')
            );
            dashTotalGeneros.textContent = String(generos.size);
        }

        renderizarGraficoGeneros();

        if (listaRecentes) {
            listaRecentes.innerHTML = '';
            if (bibliotecaMusicas.length === 0) {
                listaRecentes.innerHTML = '<p class="description">Nenhuma música cadastrada ainda.</p>';
                return;
            }

            const recentes = [...bibliotecaMusicas]
                .sort((a, b) => Number(b.id) - Number(a.id))
                .slice(0, 5);

            const ul = document.createElement('ul');
            ul.className = 'lista-recentes';
            recentes.forEach((musica) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <strong>${escapeHTML(musica.nomeMusica)}</strong>
                    <span>${escapeHTML(musica.artista)} · ${escapeHTML(musica.generoMusical) || 'Não Definido'}</span>
                `;
                ul.appendChild(li);
            });
            listaRecentes.appendChild(ul);
        }
    }

    function renderizarTabela() {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = '';

        if (bibliotecaMusicas.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr id="linhaVazia">
                    <td colspan="5" style="text-align: center;">Nenhuma música cadastrada ainda.</td>
                </tr>`;
            return;
        }

        bibliotecaMusicas.forEach((musica) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHTML(musica.nomeMusica)}</strong></td>
                <td>${escapeHTML(musica.artista)}</td>
                <td>${formatarData(musica.dataLancamento)}</td>
                <td><span class="genre-badge">${escapeHTML(musica.generoMusical) || 'Não Definido'}</span></td>
                <td class="actions-cell">
                    <button type="button" class="btn-action-edit" data-id="${musica.id}">Editar</button>
                    <button type="button" class="btn-action-delete" data-id="${musica.id}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);
        });

        document.querySelectorAll('.btn-action-edit').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.location.href = `index.html?edit=${encodeURIComponent(id)}`;
            });
        });

        document.querySelectorAll('.btn-action-delete').forEach((btn) => {
            btn.addEventListener('click', () => deletarRegistro(btn.getAttribute('data-id')));
        });
    }

    function renderizarInterface() {
        renderizarDashboard();
        renderizarTabela();
    }

    function aplicarModoEdicaoDaUrl() {
        if (!form) return;
        const params = new URLSearchParams(window.location.search);
        const idEdicao = params.get('edit');
        if (!idEdicao) return;
        carregarFormularioParaEdicao(idEdicao);
    }

    function carregarFormularioParaEdicao(id) {
        if (!form) {
            window.location.href = `index.html?edit=${encodeURIComponent(id)}`;
            return;
        }

        const musica = bibliotecaMusicas.find((m) => String(m.id) === String(id));
        if (!musica) {
            alert('Música não encontrada para edição.');
            window.history.replaceState({}, '', 'index.html');
            return;
        }

        document.getElementById('nomeMusica').value = musica.nomeMusica || '';
        document.getElementById('artista').value = musica.artista || '';
        document.getElementById('dataLancamento').value = musica.dataLancamento || '';
        document.getElementById('generoMusical').value = musica.generoMusical || '';
        document.getElementById('album').value = musica.album || '';
        document.getElementById('duracao').value = musica.duracao || '';

        if (editIndexInput) editIndexInput.value = String(id);
        if (formTitle) formTitle.textContent = 'Editar Música';
        if (btnSubmit) btnSubmit.textContent = 'Salvar Alterações';
        if (btnCancel) btnCancel.style.display = 'inline-block';
    }

    function cancelarModoEdicao() {
        if (form) form.reset();
        if (editIndexInput) editIndexInput.value = '';
        if (formTitle) formTitle.textContent = 'Cadastrar Nova Música';
        if (btnSubmit) btnSubmit.textContent = 'Salvar na Biblioteca';
        if (btnCancel) btnCancel.style.display = 'none';
        window.history.replaceState({}, '', 'index.html');
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nomeMusica = document.getElementById('nomeMusica').value.trim();
            const artista = document.getElementById('artista').value.trim();
            const dataLancamento = document.getElementById('dataLancamento').value;
            const generoMusical = document.getElementById('generoMusical').value;
            const album = document.getElementById('album').value.trim();
            const duracao = document.getElementById('duracao').value.trim();

            if (!nomeMusica || !artista || !dataLancamento) {
                alert('Por favor, preencha todos os campos obrigatórios (*)');
                return;
            }

            const dadosMusica = { nomeMusica, artista, dataLancamento, generoMusical, album, duracao };
            const idEdicao = editIndexInput ? editIndexInput.value : '';

            try {
                const url = idEdicao ? `/api/musicas/${idEdicao}` : '/api/musicas';
                const method = idEdicao ? 'PUT' : 'POST';
                const response = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosMusica)
                });

                if (!response.ok) {
                    const erro = await response.json().catch(() => ({}));
                    throw new Error(erro.error || 'Falha ao salvar a música');
                }

                if (idEdicao) {
                    alert('Música atualizada com sucesso!');
                    window.location.href = 'biblioteca.html';
                    return;
                }

                alert('Música cadastrada com sucesso!');
                form.reset();
                cancelarModoEdicao();
                await carregarMusicasDoBanco();
            } catch (error) {
                console.error('Erro ao salvar os dados:', error);
                alert(error.message || 'Erro ao salvar os dados.');
            }
        });
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', cancelarModoEdicao);
    }

    async function deletarRegistro(id) {
        const musica = bibliotecaMusicas.find((m) => String(m.id) === String(id));
        const nome = musica ? musica.nomeMusica : 'esta música';

        if (!confirm(`Deseja realmente remover a música "${nome}"?`)) return;

        try {
            const response = await fetch(`/api/musicas/${id}`, { method: 'DELETE' });
            if (response.ok) {
                alert('Música removida com sucesso!');
                await carregarMusicasDoBanco();
            } else {
                alert('Erro ao remover a música.');
            }
        } catch (error) {
            console.error('Erro ao excluir música:', error);
            alert('Erro ao excluir a música.');
        }
    }

    carregarMusicasDoBanco();
});
