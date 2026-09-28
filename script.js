document.addEventListener('DOMContentLoaded', () => {
    let bibliotecaMusicas = []; 

    const navLinks = document.querySelectorAll('.nav-link');
    const contentSections = document.querySelectorAll('.content-section');
    
    const form = document.getElementById('cadastroMusicaForm');
    const formTitle = document.getElementById('form-title');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCancel = document.getElementById('btn-cancel');
    const editIndexInput = document.getElementById('edit-index'); 
    
    const tabelaCorpo = document.querySelector('#tabelaMusicas tbody');
    const dashTotalMusicas = document.getElementById('dashTotalMusicas');
    const generoChartContainer = document.getElementById('generoChartContainer');

    function escapeHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    async function carregarMusicasDoBanco() {
        try {
            const response = await fetch('/api/musicas');
            if (!response.ok) throw new Error('Erro na resposta do servidor');
            bibliotecaMusicas = await response.json();
            renderizarInterface();
        } catch (error) {
            console.error('Erro ao buscar músicas do banco:', error);
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            if (targetId && document.getElementById(targetId)) {
                e.preventDefault();
                navLinks.forEach(item => item.classList.remove('active'));
                contentSections.forEach(section => section.style.display = 'none');
                link.classList.add('active');
                document.getElementById(targetId).style.display = 'block';
            }
        });
    });

    function renderizarGraficoGeneros() {
        if (!generoChartContainer) return;
        generoChartContainer.innerHTML = '';

        if (bibliotecaMusicas.length === 0) {
            generoChartContainer.innerHTML = '<p class="description">Sem dados para exibir.</p>';
            return;
        }

        const contagemGeneros = {};
        bibliotecaMusicas.forEach(m => {
            const genero = m.generoMusical || 'Não Definido';
            contagemGeneros[genero] = (contagemGeneros[genero] || 0) + 1;
        });

        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';

        Object.entries(contagemGeneros).forEach(([genero, qtd]) => {
            const li = document.createElement('li');
            li.style.marginBottom = '6px';
            li.innerHTML = `<strong>${escapeHTML(genero)}:</strong> ${qtd} faixa(s)`;
            ul.appendChild(li);
        });

        generoChartContainer.appendChild(ul);
    }

    function renderizarInterface() {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = '';

        if (bibliotecaMusicas.length === 0) {
            tabelaCorpo.innerHTML = `
                <tr id="linhaVazia">
                    <td colspan="5" style="text-align: center;">Nenhuma música cadastrada ainda.</td>
                </tr>`;
            if (dashTotalMusicas) dashTotalMusicas.textContent = '0';
            renderizarGraficoGeneros();
            return;
        }

        bibliotecaMusicas.forEach((musica) => {
            const dataFormatada = musica.dataLancamento ? musica.dataLancamento.split('-').reverse().join('/') : '---';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${escapeHTML(musica.nomeMusica)}</strong></td>
                <td>${escapeHTML(musica.artista)}</td>
                <td>${dataFormatada}</td>
                <td><span class="genre-badge">${escapeHTML(musica.generoMusical) || 'Não Definido'}</span></td>
                <td class="actions-cell">
                    <button type="button" class="btn-action-edit" data-id="${musica.id}">Editar</button>
                    <button type="button" class="btn-action-delete" data-id="${musica.id}">Excluir</button>
                </td>
            `;
            tabelaCorpo.appendChild(tr);        
        });

        document.querySelectorAll('.btn-action-edit').forEach(btn => {
            btn.addEventListener('click', () => carregarFormularioParaEdicao(btn.getAttribute('data-id')));
        });
        document.querySelectorAll('.btn-action-delete').forEach(btn => {
            btn.addEventListener('click', () => deletarRegistro(btn.getAttribute('data-id')));
        });

        if (dashTotalMusicas) dashTotalMusicas.textContent = bibliotecaMusicas.length;
        renderizarGraficoGeneros();
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
            const idEdicao = editIndexInput ? editIndexInput.value : "";

            try {
                if (idEdicao !== "") {
                    await fetch(`/api/musicas/${idEdicao}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosMusica)
                    });
                    alert('Música atualizada com sucesso!');
                    cancelarModoEdicao();
                } else {
                    await fetch('/api/musicas', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(dadosMusica)
                    });
                    alert('Música cadastrada com sucesso!');
                }

                form.reset();
                carregarMusicasDoBanco(); 
            } catch (error) {
                console.error('Erro ao salvar os dados:', error);
            }
        });
    }

    function carregarFormularioParaEdicao(id) {
        const musica = bibliotecaMusicas.find(m => m.id == id);
        if (!musica) return;

        document.getElementById('nomeMusica').value = musica.nomeMusica || '';
        document.getElementById('artista').value = musica.artista || '';
        document.getElementById('dataLancamento').value = musica.dataLancamento || '';
        document.getElementById('generoMusical').value = musica.generoMusical || '';
        document.getElementById('album').value = musica.album || '';
        document.getElementById('duracao').value = musica.duracao || '';

        if (editIndexInput) editIndexInput.value = id; 
        if (formTitle) formTitle.textContent = "Editar Música";
        if (btnSubmit) btnSubmit.textContent = "Salvar Alterações";
        if (btnCancel) btnCancel.style.display = "inline-block";

        const btnCadastro = document.querySelector('[data-target="cadastro-content"]');
        if (btnCadastro) btnCadastro.click();
    }

    if (btnCancel) {
        btnCancel.addEventListener('click', cancelarModoEdicao);
    }

    function cancelarModoEdicao() {
        if (form) form.reset();
        if (editIndexInput) editIndexInput.value = "";
        if (formTitle) formTitle.textContent = "Cadastrar Nova Música";
        if (btnSubmit) btnSubmit.textContent = "Salvar na Biblioteca";
        if (btnCancel) btnCancel.style.display = "none";
    }

    async function deletarRegistro(id) {
        const musica = bibliotecaMusicas.find(m => m.id == id);
        const nome = musica ? musica.nomeMusica : 'esta música';
        
        if (confirm(`Deseja realmente remover a música "${nome}"?`)) {
            try {
                const response = await fetch(`/api/musicas/${id}`, { method: 'DELETE' });
                if (response.ok) {
                    alert('Música removida com sucesso!');
                    carregarMusicasDoBanco();
                } else {
                    alert('Erro ao remover a música.');
                }
            } catch (error) {
                console.error('Erro ao excluir música:', error);
            }
        }
    }

    carregarMusicasDoBanco();
});