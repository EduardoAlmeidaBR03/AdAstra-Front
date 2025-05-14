// Configuração da API
const API_URL = 'http://127.0.0.1:8000';

// Elementos do DOM
const elements = {
    tabs: {
        lista: document.getElementById('lista-tab'),
        cadastro: document.getElementById('cadastro-tab'),
        detalhes: document.getElementById('detalhes-tab')
    },
    loaders: {
        lista: document.getElementById('listaLoader'),
        detalhes: document.getElementById('detalhesLoader')
    },
    lista: {
        container: document.getElementById('listaPacotes'),
        btnRecarregar: document.getElementById('btnRecarregarLista'),
        searchInput: document.getElementById('searchPacote'),
        searchButton: document.getElementById('btnSearchPacote'),
        filterTipo: document.getElementById('filterTipo'),
        filterDisponibilidade: document.getElementById('filterDisponibilidade'),
        paginacao: document.getElementById('paginacaoPacotes')
    },
    form: {
        el: document.getElementById('formPacote'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('pacoteId'),
        nome: document.getElementById('nome'),
        tipo: document.getElementById('tipo'),
        preco: document.getElementById('preco'),
        disponibilidade: document.getElementById('disponibilidade'),
        descricao: document.getElementById('descricao'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },
    detalhes: {
        container: document.getElementById('detalhesPacote'),
        titulo: document.getElementById('detalhesTitulo'),
        tipo: document.getElementById('detalhesTipo'),
        preco: document.getElementById('detalhesPreco'),
        disponibilidade: document.getElementById('detalhesDisponibilidade'),
        descricao: document.getElementById('detalhesDescricao'),
        btnEditar: document.getElementById('btnEditar'),
        btnExcluir: document.getElementById('btnExcluir')
    },
    modal: {
        el: new bootstrap.Modal(document.getElementById('confirmModal')),
        message: document.getElementById('confirmMessage'),
        btnConfirm: document.getElementById('btnConfirmAction')
    }
};

// Estado da aplicação
let pacoteAtual = null;
let acaoConfirmacao = null;
let todosPacotes = []; // Armazenar todos os pacotes para pesquisa local
let paginaAtual = 1;
let itensPorPagina = 6; // 2 linhas de 3 pacotes
let ordenacao = { campo: 'nome', direcao: 'asc' };

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
    carregarPacotes();
    setupEventListeners();
});

// Configuração dos event listeners
function setupEventListeners() {
    elements.lista.btnRecarregar.addEventListener('click', carregarPacotes);
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    elements.detalhes.btnEditar.addEventListener('click', editarPacote);
    elements.detalhes.btnExcluir.addEventListener('click', confirmarExclusao);
    
    // Eventos de pesquisa e filtro
    elements.lista.searchButton.addEventListener('click', filtrarPacotes);
    elements.lista.searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filtrarPacotes();
    });
    elements.lista.filterTipo.addEventListener('change', filtrarPacotes);
    elements.lista.filterDisponibilidade.addEventListener('change', filtrarPacotes);
    
    // Eventos de ordenação
    document.querySelectorAll('[data-sort]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const campo = e.currentTarget.dataset.sort;
            if (ordenacao.campo === campo) {
                // Alternar direção se clicar no mesmo campo novamente
                ordenacao.direcao = ordenacao.direcao === 'asc' ? 'desc' : 'asc';
            } else {
                // Nova ordenação, começar ascendente
                ordenacao.campo = campo;
                ordenacao.direcao = 'asc';
            }
            
            // Atualizar ícones dos botões
            atualizarBotoesOrdenacao();
            
            // Filtrar/ordenar pacotes
            filtrarPacotes();
        });
    });
    
    elements.modal.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.el.hide();
        }
    });
}

// Atualizar ícones dos botões de ordenação
function atualizarBotoesOrdenacao() {
    document.querySelectorAll('[data-sort]').forEach(btn => {
        const campo = btn.dataset.sort;
        const iconElement = btn.querySelector('i');
        
        // Remover todas as classes de ordenação
        iconElement.classList.remove('bi-sort-alpha-down', 'bi-sort-alpha-up', 'bi-sort-numeric-down', 'bi-sort-numeric-up');
        
        // Adicionar classe apropriada
        if (campo === ordenacao.campo) {
            if (campo === 'preco') {
                iconElement.classList.add(ordenacao.direcao === 'asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up');
            } else {
                iconElement.classList.add(ordenacao.direcao === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up');
            }
            // Destacar botão ativo
            btn.classList.add('active', 'btn-secondary');
            btn.classList.remove('btn-outline-secondary');
        } else {
            // Estilo normal para botões não ativos
            if (campo === 'preco') {
                iconElement.classList.add('bi-sort-numeric-down');
            } else {
                iconElement.classList.add('bi-sort-alpha-down');
            }
            btn.classList.remove('active', 'btn-secondary');
            btn.classList.add('btn-outline-secondary');
        }
    });
}

// Funções de UI
function exibirLoader(loader, show = true) {
    loader.style.display = show ? 'inline-block' : 'none';
}

function mostrarAlerta(mensagem, tipo = 'success', duracao = 5000) {
    const alertContainer = document.querySelector('.alert-container');
    
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertEl.role = 'alert';
    
    alertEl.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;
    
    alertContainer.appendChild(alertEl);
    
    setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 300);
    }, duracao);
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Funções da API
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (options.method === 'DELETE') {
            return { success: response.ok };
        }
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro na comunicação com a API');
        }
        
        if (response.status === 204) {
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro na comunicação com a API:', error);
        mostrarAlerta(`Erro: ${error.message}`, 'danger');
        throw error;
    }
}

// Carregar lista de pacotes
async function carregarPacotes() {
    try {
        exibirLoader(elements.loaders.lista, true);
        elements.lista.container.innerHTML = '';
        
        const pacotes = await fetchAPI('/packages/');
        console.log('Pacotes carregados:', pacotes);
        
        // Corrigir possíveis problemas de encoding
        const pacotesCorrigidos = pacotes.map(p => ({
            ...p,
            nome: corrigirTexto(p.nome),
            descricao: corrigirTexto(p.descricao),
            tipo: corrigirTexto(p.tipo)
        }));
        
        // Armazenar para filtro local
        todosPacotes = pacotesCorrigidos;
        
        renderizarListaPacotes(pacotesCorrigidos);
    } catch (error) {
        console.error('Erro ao carregar pacotes:', error);
        mostrarAlerta('Erro ao carregar pacotes. Por favor, tente novamente.', 'danger');
        elements.lista.container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    Falha ao carregar pacotes. Erro: ${error.message}
                </div>
            </div>
        `;
    } finally {
        exibirLoader(elements.loaders.lista, false);
    }
}

// Corrigir problemas de encoding em strings
function corrigirTexto(texto) {
    if (!texto) return '';
    
    // Mapeamento de caracteres com problemas comuns de encoding
    const mapa = {
        'Ã£': 'ã',
        'Ãµ': 'õ',
        'Ã¡': 'á',
        'Ã©': 'é',
        'Ãº': 'ú',
        'Ã­': 'í',
        'Ã³': 'ó',
        'Ã§': 'ç',
        'Ãª': 'ê',
        'Ã´': 'ô',
        'Ã¢': 'â'
    };
    
    let resultado = texto;
    for (const [problematico, correto] of Object.entries(mapa)) {
        resultado = resultado.replaceAll(problematico, correto);
    }
    
    return resultado;
}

// Filtrar pacotes
function filtrarPacotes() {
    const termoBusca = elements.lista.searchInput.value.toLowerCase().trim();
    const tipoFiltro = elements.lista.filterTipo.value;
    const dispFiltro = elements.lista.filterDisponibilidade.value;
    
    const pacotesFiltrados = todosPacotes.filter(pacote => {
        const matchTermo = termoBusca === '' || 
            pacote.nome?.toLowerCase().includes(termoBusca) || 
            pacote.descricao?.toLowerCase().includes(termoBusca) ||
            pacote.tipo?.toLowerCase().includes(termoBusca);
            
        const matchTipo = tipoFiltro === '' || pacote.tipo === tipoFiltro;
        
        const matchDisp = dispFiltro === '' || 
            (dispFiltro === 'true' && pacote.disponibilidade) || 
            (dispFiltro === 'false' && !pacote.disponibilidade);
        
        return matchTermo && matchTipo && matchDisp;
    });
    
    // Ordenar pacotes
    pacotesFiltrados.sort((a, b) => {
        const valorA = a[ordenacao.campo];
        const valorB = b[ordenacao.campo];
        
        if (ordenacao.direcao === 'asc') {
            return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
        } else {
            return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
        }
    });
    
    // Resetar para a primeira página quando filtrar
    paginaAtual = 1;
    renderizarListaPacotes(pacotesFiltrados);
}

// Renderizar lista de pacotes
function renderizarListaPacotes(pacotes) {
    elements.lista.container.innerHTML = '';
    
    if (!pacotes || pacotes.length === 0) {
        elements.lista.container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info">
                    Nenhum pacote cadastrado. Clique em "Novo Pacote" para começar.
                </div>
            </div>
        `;
        // Limpar a paginação se não houver pacotes
        elements.lista.paginacao.innerHTML = '';
        return;
    }
    
    // Calcular paginação
    const totalPaginas = Math.ceil(pacotes.length / itensPorPagina);
    
    // Ajustar página atual se necessário
    if (paginaAtual > totalPaginas) {
        paginaAtual = totalPaginas;
    }
    
    // Calcular índices para a página atual
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = Math.min(inicio + itensPorPagina, pacotes.length);
    
    // Exibir apenas os pacotes da página atual
    const pacotesDaPagina = pacotes.slice(inicio, fim);
    
    pacotesDaPagina.forEach(pacote => {
        try {
            const descricao = pacote.descricao || '';
            const descricaoCurta = descricao.length > 100 ? 
                descricao.substring(0, 100) + '...' : 
                descricao;
            
            const card = document.createElement('div');
            card.className = 'col-md-4 mb-4';
            
            // Definir ícone baseado no tipo de pacote
            let icone = 'bi-rocket';
            let corIcone = 'text-primary';
            
            if (pacote.tipo?.toLowerCase().includes('orbital')) {
                icone = 'bi-globe';
                corIcone = 'text-info';
            } else if (pacote.tipo?.toLowerCase().includes('estação')) {
                icone = 'bi-building';
                corIcone = 'text-warning';
            } else if (pacote.tipo?.toLowerCase().includes('lunar')) {
                icone = 'bi-moon';
                corIcone = 'text-secondary';
            } else if (pacote.tipo?.toLowerCase().includes('interplanetário')) {
                icone = 'bi-stars';
                corIcone = 'text-danger';
            }
            
            card.innerHTML = `
                <div class="card h-100 ${pacote.disponibilidade ? '' : 'bg-light'} shadow-sm">
                    <div class="card-header bg-${pacote.disponibilidade ? 'white' : 'light'} text-center py-3">
                        <i class="bi ${icone} ${corIcone} display-5"></i>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title text-center">${pacote.nome || 'Sem nome'}</h5>
                        <div class="text-center mb-3">
                            <span class="badge bg-${pacote.disponibilidade ? 'success' : 'secondary'} rounded-pill px-3 py-2">
                                ${pacote.disponibilidade ? 'Disponível' : 'Indisponível'}
                            </span>
                        </div>
                        <h6 class="card-subtitle mb-2 text-muted text-center">${pacote.tipo || 'Tipo não especificado'}</h6>
                        <p class="card-text text-center mt-3">
                            ${descricaoCurta}
                        </p>
                    </div>
                    <div class="card-footer bg-transparent">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="text-primary mb-0 fw-bold">${formatarMoeda(parseFloat(pacote.preco) || 0)}</h5>
                            <button class="btn btn-outline-primary btn-sm" onclick="carregarDetalhesPacote('${pacote.id}')">
                                <i class="bi bi-info-circle"></i> Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            elements.lista.container.appendChild(card);
        } catch (error) {
            console.error('Erro ao renderizar pacote:', pacote, error);
        }
    });
    
    // Adicionar controles de paginação
    renderizarPaginacao(pacotes.length);
}

// Renderizar controles de paginação
function renderizarPaginacao(totalItems) {
    if (!elements.lista.paginacao) return;
    
    elements.lista.paginacao.innerHTML = '';
    
    // Calcular total de páginas
    const totalPaginas = Math.ceil(totalItems / itensPorPagina);
    
    // Se tiver apenas uma página ou nenhum item, não mostrar paginação
    if (totalPaginas <= 1) {
        return;
    }
    
    // Adicionar botão "Anterior"
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `
        <a class="page-link" href="#" aria-label="Anterior" ${paginaAtual === 1 ? 'tabindex="-1" aria-disabled="true"' : ''}>
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    liAnterior.addEventListener('click', (e) => {
        e.preventDefault();
        if (paginaAtual > 1) {
            paginaAtual--;
            filtrarPacotes();
        }
    });
    elements.lista.paginacao.appendChild(liAnterior);
    
    // Determinar quais números de página mostrar
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, startPage + 4);
    
    // Ajustar início para garantir que sempre mostre 5 páginas se possível
    if (endPage - startPage < 4 && startPage > 1) {
        startPage = Math.max(1, endPage - 4);
    }
    
    // Adicionar botões de página
    for (let i = startPage; i <= endPage; i++) {
        const liPagina = document.createElement('li');
        liPagina.className = `page-item ${paginaAtual === i ? 'active' : ''}`;
        liPagina.innerHTML = `
            <a class="page-link" href="#">${i}</a>
        `;
        liPagina.addEventListener('click', (e) => {
            e.preventDefault();
            paginaAtual = i;
            filtrarPacotes();
        });
        elements.lista.paginacao.appendChild(liPagina);
    }
    
    // Adicionar botão "Próximo"
    const liProximo = document.createElement('li');
    liProximo.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
    liProximo.innerHTML = `
        <a class="page-link" href="#" aria-label="Próximo" ${paginaAtual === totalPaginas ? 'tabindex="-1" aria-disabled="true"' : ''}>
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    liProximo.addEventListener('click', (e) => {
        e.preventDefault();
        if (paginaAtual < totalPaginas) {
            paginaAtual++;
            filtrarPacotes();
        }
    });
    elements.lista.paginacao.appendChild(liProximo);
}

// Carregar detalhes de um pacote
async function carregarDetalhesPacote(id) {
    try {
        exibirLoader(elements.loaders.detalhes, true);
        elements.detalhes.container.style.display = 'none';
        
        const pacote = await fetchAPI(`/packages/${id}`);
        console.log('Detalhes do pacote:', pacote);
        
        // Corrigir encoding nos detalhes do pacote
        const pacoteCorrigido = {
            ...pacote,
            nome: corrigirTexto(pacote.nome),
            descricao: corrigirTexto(pacote.descricao),
            tipo: corrigirTexto(pacote.tipo)
        };
        
        pacoteAtual = pacoteCorrigido;
        renderizarDetalhesPacote(pacoteCorrigido);
        
        elements.tabs.detalhes.click();
    } catch (error) {
        console.error('Erro ao carregar detalhes do pacote:', error);
        mostrarAlerta('Erro ao carregar detalhes do pacote. Por favor, tente novamente.', 'danger');
    } finally {
        exibirLoader(elements.loaders.detalhes, false);
        elements.detalhes.container.style.display = 'block';
    }
}

// Renderizar detalhes do pacote
function renderizarDetalhesPacote(pacote) {
    try {
        // Definir ícone baseado no tipo de pacote
        let icone = 'bi-rocket';
        let corIcone = 'text-primary';
        
        if (pacote.tipo?.toLowerCase().includes('orbital')) {
            icone = 'bi-globe';
            corIcone = 'text-info';
        } else if (pacote.tipo?.toLowerCase().includes('estação')) {
            icone = 'bi-building';
            corIcone = 'text-warning';
        } else if (pacote.tipo?.toLowerCase().includes('lunar')) {
            icone = 'bi-moon';
            corIcone = 'text-secondary';
        } else if (pacote.tipo?.toLowerCase().includes('interplanetário')) {
            icone = 'bi-stars';
            corIcone = 'text-danger';
        }
        
        // Adicionar ícone ao título
        elements.detalhes.titulo.innerHTML = `
            <i class="bi ${icone} ${corIcone} me-2"></i> 
            ${pacote.nome || 'Nome não informado'}
        `;
        
        elements.detalhes.tipo.textContent = pacote.tipo || 'Tipo não informado';
        elements.detalhes.preco.textContent = formatarMoeda(parseFloat(pacote.preco) || 0);
        elements.detalhes.disponibilidade.innerHTML = pacote.disponibilidade
            ? '<span class="badge bg-success px-3 py-2">Disponível para venda</span>'
            : '<span class="badge bg-secondary px-3 py-2">Indisponível para venda</span>';
        elements.detalhes.descricao.textContent = pacote.descricao || 'Descrição não disponível';
        
        // Atualizar estado dos botões de acordo com o pacote
        elements.detalhes.btnEditar.disabled = false;
        elements.detalhes.btnExcluir.disabled = false;
    } catch (error) {
        console.error('Erro ao renderizar detalhes do pacote:', error);
        mostrarAlerta('Erro ao exibir detalhes do pacote', 'danger');
    }
}

// Editar pacote
function editarPacote() {
    if (!pacoteAtual) return;
    
    elements.form.title.textContent = 'Editar Pacote';
    elements.form.id.value = pacoteAtual.id;
    elements.form.nome.value = pacoteAtual.nome || '';
    elements.form.tipo.value = pacoteAtual.tipo || '';
    elements.form.preco.value = pacoteAtual.preco || 0;
    elements.form.disponibilidade.checked = Boolean(pacoteAtual.disponibilidade);
    elements.form.descricao.value = pacoteAtual.descricao || '';
    
    elements.tabs.cadastro.click();
}

// Confirmar exclusão do pacote
function confirmarExclusao() {
    if (!pacoteAtual) return;
    
    confirmarAcao(`Tem certeza que deseja excluir o pacote "${pacoteAtual.nome}"?`, () => {
        excluirPacote(pacoteAtual.id);
    });
}

// Excluir pacote
async function excluirPacote(id) {
    try {
        await fetchAPI(`/packages/${id}`, { method: 'DELETE' });
        
        mostrarAlerta('Pacote excluído com sucesso!', 'success');
        pacoteAtual = null;
        carregarPacotes();
        elements.tabs.lista.click();
    } catch (error) {
        console.error('Erro ao excluir pacote:', error);
        mostrarAlerta('Erro ao excluir pacote. Por favor, tente novamente.', 'danger');
    }
}

// Handler do formulário
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const pacoteData = {
        nome: elements.form.nome.value.trim(),
        tipo: elements.form.tipo.value,
        preco: parseFloat(elements.form.preco.value),
        disponibilidade: elements.form.disponibilidade.checked,
        descricao: elements.form.descricao.value.trim()
    };
    
    // Validação básica
    if (!pacoteData.nome) {
        mostrarAlerta('Por favor, informe o nome do pacote.', 'danger');
        return;
    }
    
    if (!pacoteData.tipo) {
        mostrarAlerta('Por favor, selecione o tipo do pacote.', 'danger');
        return;
    }
    
    if (isNaN(pacoteData.preco) || pacoteData.preco <= 0) {
        mostrarAlerta('Por favor, informe um preço válido.', 'danger');
        return;
    }
    
    try {
        if (elements.form.id.value) {
            // Atualizar pacote existente
            await atualizarPacote(elements.form.id.value, pacoteData);
            mostrarAlerta('Pacote atualizado com sucesso!', 'success');
        } else {
            // Criar novo pacote
            await criarPacote(pacoteData);
            mostrarAlerta('Pacote criado com sucesso!', 'success');
        }
        
        resetForm();
        carregarPacotes();
        elements.tabs.lista.click();
    } catch (error) {
        console.error('Erro ao salvar pacote:', error);
        mostrarAlerta(`Erro ao salvar pacote: ${error.message}`, 'danger');
    }
}

// Criar novo pacote
async function criarPacote(pacoteData) {
    return await fetchAPI('/packages/', {
        method: 'POST',
        body: JSON.stringify(pacoteData)
    });
}

// Atualizar pacote existente
async function atualizarPacote(id, pacoteData) {
    return await fetchAPI(`/packages/${id}`, {
        method: 'PUT',
        body: JSON.stringify(pacoteData)
    });
}

// Reset do formulário
function resetForm() {
    elements.form.title.textContent = 'Novo Pacote';
    elements.form.el.reset();
    elements.form.id.value = '';
}

// Modal de confirmação
function confirmarAcao(mensagem, callback) {
    elements.modal.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.el.show();
}
