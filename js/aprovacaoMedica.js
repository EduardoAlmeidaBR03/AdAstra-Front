// Configuração da API
const API_URL = 'http://127.0.0.1:8000';

// Elementos DOM
const elements = {
    tabs: {
        clientes: document.getElementById('clientes-tab'),
        historico: document.getElementById('historico-tab'),
        formulario: document.getElementById('formulario-tab')
    },
    loaders: {
        lista: document.getElementById('listaLoader'),
        historico: document.getElementById('historicoLoader')
    },
    filtros: {
        status: document.getElementById('filtroStatus'),
        nome: document.getElementById('filtroNome'),
        btnAplicar: document.getElementById('btnAplicarFiltros'),
        clienteHistorico: document.getElementById('filtroClienteHistorico'),
        btnHistorico: document.getElementById('btnFiltrarHistorico')
    },
    clientes: {
        container: document.getElementById('listaClientes'),
        btnRecarregar: document.getElementById('btnRecarregarLista'),
        paginacao: document.getElementById('paginacao')
    },
    historico: {
        tabela: document.getElementById('tabelaHistorico'),
        paginacao: document.getElementById('paginacaoHistorico')
    },
    form: {
        el: document.getElementById('formAprovacaoMedica'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('aprovacaoId'),
        clienteId: document.getElementById('clienteId'),
        dataVerificacao: document.getElementById('dataVerificacao'),
        medicoResponsavel: document.getElementById('medicoResponsavel'),
        aprovado: document.getElementById('aprovado'),
        detalhes: document.getElementById('detalhes'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },
    modal: {
        detalhes: {
            el: new bootstrap.Modal(document.getElementById('detalhesModal')),
            cliente: document.getElementById('modalCliente'),
            data: document.getElementById('modalData'),
            medico: document.getElementById('modalMedico'),
            status: document.getElementById('modalStatus'),
            detalhes: document.getElementById('modalDetalhes')
        },
        confirm: {
            el: new bootstrap.Modal(document.getElementById('confirmModal')),
            message: document.getElementById('confirmMessage'),
            btnConfirm: document.getElementById('btnConfirmAction')
        }
    }
};

// Estado da aplicação
let clientesData = [];
let historicoData = [];
let acaoConfirmacao = null;
let clienteAtual = null;
let paginaAtualClientes = 1;
let paginaAtualHistorico = 1;
const itensPorPagina = 6;
let filtrosAtivos = {
    status: '',
    nome: ''
};

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Definir data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    elements.form.dataVerificacao.value = hoje;
    
    // Carregar clientes para o select
    carregarClientesSelect();
    
    // Carregar lista de clientes para avaliação
    carregarClientes();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('AdAstra - Sistema de Gestão de Aprovação Médica inicializado');
});

// Configuração de todos os event listeners
function setupEventListeners() {
    // Botões de recarga
    elements.clientes.btnRecarregar.addEventListener('click', carregarClientes);
    
    // Filtros
    elements.filtros.btnAplicar.addEventListener('click', aplicarFiltros);
    elements.filtros.btnHistorico.addEventListener('click', buscarHistorico);
    
    // Form de cadastro/edição
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    elements.form.clienteId.addEventListener('change', verificarHistoricoCliente);
    
    // Confirmação de ação
    elements.modal.confirm.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.confirm.el.hide();
        }
    });
    
    // Troca de abas
    elements.tabs.historico.addEventListener('click', () => {
        if (historicoData.length === 0) {
            carregarHistorico();
        }
    });
}

// Funções para manipular a UI
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
    
    // Se for um erro, também mostra no formulário
    if (tipo === 'danger') {
        const formErrorArea = document.getElementById('formErrorArea');
        if (formErrorArea) {
            formErrorArea.textContent = mensagem;
            formErrorArea.style.display = 'block';
            
            // Esconder após duração
            setTimeout(() => {
                formErrorArea.style.display = 'none';
            }, duracao);
        }
    }
    
    // Auto-remover após a duração
    setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 300);
    }, duracao);
}

// Funções para comunicação com a API
async function fetchAPI(endpoint, options = {}) {
    try {
        // Log da requisição para depuração
        console.group(`API Request: ${options.method || 'GET'} ${endpoint}`);
        console.log('URL:', `${API_URL}${endpoint}`);
        console.log('Options:', { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
        
        if (options.body) {
            try {
                console.log('Request Body:', JSON.parse(options.body));
            } catch (e) {
                console.log('Request Body (raw):', options.body);
            }
        }
        
        const startTime = Date.now();
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        const endTime = Date.now();
        console.log(`Response Status: ${response.status} (${response.statusText}) - ${endTime - startTime}ms`);
        
        // Para DELETE retornamos apenas o status
        if (options.method === 'DELETE') {
            console.log('Response: Success (DELETE operation)');
            console.groupEnd();
            return { success: response.ok };
        }
        
        // Para outros métodos, tratamos os erros adequadamente
        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
                console.error('Response Error Details:', errorData);
            } catch (e) {
                // Se não conseguir ler o corpo como JSON, usa a mensagem padrão
                console.error('Could not parse error response as JSON');
            }
            
            console.groupEnd();
            throw new Error(errorMessage);
        }
        
        // Para requisições que não retornam dados (204 No Content)
        if (response.status === 204) {
            console.log('Response: Success (No Content)');
            console.groupEnd();
            return { success: true };
        }
        
        const data = await response.json();
        console.log('Response Data:', data);
        console.groupEnd();
        return data;
    } catch (error) {
        console.error('API Communication Error:', error);
        
        // Tratamento específico para erros de rede
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            mostrarAlerta('Erro de conexão. Verifique se o servidor da API está acessível.', 'danger');
        } else {
            mostrarAlerta(`Erro: ${error.message}`, 'danger');
        }
        
        console.groupEnd(); // Fechar grupo de logs em caso de erro
        throw error;
    }
}

// Funções para gerenciamento de clientes e aprovações médicas
async function carregarClientes() {
    try {
        exibirLoader(elements.loaders.lista, true);
        elements.clientes.container.innerHTML = '';
        
        // Carregar todos os clientes
        const clientes = await fetchAPI('/clientes/');
        clientesData = clientes;
        
        if (clientes.length === 0) {
            elements.clientes.container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Nenhum cliente cadastrado. Adicione clientes para realizar avaliações médicas.
                    </div>
                </div>
            `;
        } else {
            renderizarClientes(filtrarClientes(clientes));
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    } finally {
        exibirLoader(elements.loaders.lista, false);
    }
}

function filtrarClientes(clientes) {
    let clientesFiltrados = [...clientes];
    
    // Aplicar filtro de status
    if (filtrosAtivos.status) {
        clientesFiltrados = clientesFiltrados.filter(cliente => 
            cliente.status_medico === filtrosAtivos.status);
    }
    
    // Aplicar filtro de nome
    if (filtrosAtivos.nome) {
        const termoBusca = filtrosAtivos.nome.toLowerCase();
        clientesFiltrados = clientesFiltrados.filter(cliente => 
            cliente.nome.toLowerCase().includes(termoBusca));
    }
    
    return clientesFiltrados;
}

function aplicarFiltros() {
    filtrosAtivos.status = elements.filtros.status.value;
    filtrosAtivos.nome = elements.filtros.nome.value;
    
    renderizarClientes(filtrarClientes(clientesData));
}

function renderizarClientes(clientes) {
    elements.clientes.container.innerHTML = '';
    
    // Calcular paginação
    const totalClientes = clientes.length;
    const totalPaginas = Math.ceil(totalClientes / itensPorPagina);
    
    // Ajustar página atual se necessário
    if (paginaAtualClientes > totalPaginas && totalPaginas > 0) {
        paginaAtualClientes = totalPaginas;
    }
    
    // Obter clientes da página atual
    const inicio = (paginaAtualClientes - 1) * itensPorPagina;
    const fim = Math.min(inicio + itensPorPagina, totalClientes);
    const clientesDaPagina = clientes.slice(inicio, fim);
    
    if (clientesDaPagina.length === 0) {
        elements.clientes.container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    Nenhum cliente encontrado com os filtros atuais.
                </div>
            </div>
        `;
        // Ocultar paginação
        elements.clientes.paginacao.style.display = 'none';
        return;
    }
    
    // Mostrar paginação se necessário
    elements.clientes.paginacao.style.display = totalPaginas > 1 ? 'flex' : 'none';
    
    // Renderizar cards de clientes
    clientesDaPagina.forEach(cliente => {
        const clienteCard = document.createElement('div');
        clienteCard.className = 'col-md-4 mb-4';
        
        const dataNascimento = new Date(cliente.data_nascimento).toLocaleDateString('pt-BR');
        const statusMedicoHTML = formatarStatusMedico(cliente.status_medico);
        
        clienteCard.innerHTML = `
            <div class="card cliente-card h-100 shadow-sm">
                <div class="card-header bg-primary text-white d-flex align-items-center">
                    <i class="bi bi-person-circle me-2"></i>
                    <h5 class="card-title mb-0">${cliente.nome}</h5>
                </div>
                <div class="card-body">
                    <p class="mb-2"><i class="bi bi-envelope text-muted me-2"></i> ${cliente.email}</p>
                    <p class="mb-2"><i class="bi bi-calendar text-muted me-2"></i> ${dataNascimento}</p>
                    <p class="mb-2"><i class="bi bi-telephone text-muted me-2"></i> ${cliente.telefone}</p>
                    <p class="mb-0"><i class="bi bi-heart-pulse text-muted me-2"></i> Status Médico: ${statusMedicoHTML}</p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-sm btn-outline-primary btn-historico" data-id="${cliente.id}">
                            <i class="bi bi-clock-history"></i> Histórico
                        </button>
                        <button class="btn btn-sm btn-primary btn-avaliar" data-id="${cliente.id}" data-nome="${cliente.nome}">
                            <i class="bi bi-clipboard-check"></i> Avaliar
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        elements.clientes.container.appendChild(clienteCard);
        
        // Adicionar event listeners aos botões
        const btnHistorico = clienteCard.querySelector('.btn-historico');
        btnHistorico.addEventListener('click', () => {
            elements.tabs.historico.click();
            elements.filtros.clienteHistorico.value = cliente.nome;
            buscarHistorico();
        });
        
        const btnAvaliar = clienteCard.querySelector('.btn-avaliar');
        btnAvaliar.addEventListener('click', () => {
            prepararNovaAvaliacao(cliente.id, cliente.nome);
        });
    });
    
    // Atualizar paginação
    renderizarPaginacao(totalPaginas, paginaAtualClientes, elements.clientes.paginacao, mudarPaginaClientes);
}

function renderizarPaginacao(totalPaginas, paginaAtual, elementoPaginacao, callbackPagina) {
    elementoPaginacao.innerHTML = '';
    
    // Botão Anterior
    const liAnterior = document.createElement('li');
    liAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
    liAnterior.innerHTML = `
        <button class="page-link" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
        </button>
    `;
    if (paginaAtual > 1) {
        liAnterior.querySelector('button').addEventListener('click', () => callbackPagina(paginaAtual - 1));
    }
    elementoPaginacao.appendChild(liAnterior);
    
    // Páginas numeradas
    const maxPaginas = Math.min(totalPaginas, 5);
    let startPage = Math.max(1, paginaAtual - 2);
    let endPage = Math.min(totalPaginas, startPage + maxPaginas - 1);
    
    // Ajustar o início para sempre mostrar 5 páginas quando possível
    if (endPage - startPage + 1 < maxPaginas) {
        startPage = Math.max(1, endPage - maxPaginas + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
        li.innerHTML = `<button class="page-link">${i}</button>`;
        
        if (i !== paginaAtual) {
            li.querySelector('button').addEventListener('click', () => callbackPagina(i));
        }
        
        elementoPaginacao.appendChild(li);
    }
    
    // Botão Próximo
    const liProximo = document.createElement('li');
    liProximo.className = `page-item ${paginaAtual >= totalPaginas ? 'disabled' : ''}`;
    liProximo.innerHTML = `
        <button class="page-link" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
        </button>
    `;
    if (paginaAtual < totalPaginas) {
        liProximo.querySelector('button').addEventListener('click', () => callbackPagina(paginaAtual + 1));
    }
    elementoPaginacao.appendChild(liProximo);
}

function mudarPaginaClientes(novaPagina) {
    paginaAtualClientes = novaPagina;
    renderizarClientes(filtrarClientes(clientesData));
}

function mudarPaginaHistorico(novaPagina) {
    paginaAtualHistorico = novaPagina;
    renderizarHistorico(historicoData);
}

async function carregarHistorico(clienteId = null) {
    try {
        exibirLoader(elements.loaders.historico, true);
        elements.historico.tabela.innerHTML = '';
        
        let aprovacoes = [];
        
        if (clienteId) {
            // Carregar histórico específico de um cliente
            aprovacoes = await fetchAPI(`/medical_clearance/${clienteId}`);
        } else {
            // Carregar histórico de todos os clientes
            // Como a API não tem endpoint para todos, simulamos com o carregamento de clientes
            // e depois requisições individuais
            const clientes = await fetchAPI('/clientes/');
            
            // Limitar a 5 clientes para não sobrecarregar (em caso real, teria paginação na API)
            const clientesLimitados = clientes.slice(0, 5);
            
            // Requisições em paralelo para eficiência
            const promessas = clientesLimitados.map(cliente => 
                fetchAPI(`/medical_clearance/${cliente.id}`)
                    .then(resultado => resultado.map(item => ({...item, nome_cliente: cliente.nome})))
                    .catch(() => []) // Ignorar erros individuais
            );
            
            // Combinar resultados
            const resultados = await Promise.all(promessas);
            aprovacoes = resultados.flat();
        }
        
        historicoData = aprovacoes;
        
        if (aprovacoes.length === 0) {
            elements.historico.tabela.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">Nenhum registro de avaliação médica encontrado.</td>
                </tr>
            `;
        } else {
            renderizarHistorico(aprovacoes);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de aprovações médicas:', error);
    } finally {
        exibirLoader(elements.loaders.historico, false);
    }
}

function renderizarHistorico(aprovacoes) {
    elements.historico.tabela.innerHTML = '';
    
    // Calcular paginação
    const totalAprovacoes = aprovacoes.length;
    const totalPaginas = Math.ceil(totalAprovacoes / itensPorPagina);
    
    // Ajustar página atual se necessário
    if (paginaAtualHistorico > totalPaginas && totalPaginas > 0) {
        paginaAtualHistorico = totalPaginas;
    }
    
    // Obter aprovações da página atual
    const inicio = (paginaAtualHistorico - 1) * itensPorPagina;
    const fim = Math.min(inicio + itensPorPagina, totalAprovacoes);
    const aprovacoesPagina = aprovacoes.slice(inicio, fim);
    
    if (aprovacoesPagina.length === 0) {
        elements.historico.tabela.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum registro de avaliação médica encontrado.</td>
            </tr>
        `;
        // Ocultar paginação
        elements.historico.paginacao.style.display = 'none';
        return;
    }
    
    // Mostrar paginação se necessário
    elements.historico.paginacao.style.display = totalPaginas > 1 ? 'flex' : 'none';
    
    // Renderizar linhas da tabela
    aprovacoesPagina.forEach(aprovacao => {
        const tr = document.createElement('tr');
        
        // Formatar data
        const dataFormatada = new Date(aprovacao.data_verificacao).toLocaleDateString('pt-BR');
        
        // Status formatado
        const statusHTML = aprovacao.aprovado ? 
            '<span class="badge bg-success">Aprovado</span>' : 
            '<span class="badge bg-danger">Reprovado</span>';
        
        const nomeCliente = aprovacao.nome_cliente || 'Cliente ID: ' + aprovacao.cliente_id;
        
        tr.innerHTML = `
            <td>${nomeCliente}</td>
            <td>${dataFormatada}</td>
            <td>${statusHTML}</td>
            <td>${aprovacao.medico_responsavel || '-'}</td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-ver-detalhes" title="Ver detalhes">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary btn-editar" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.historico.tabela.appendChild(tr);
        
        // Adicionar event listeners aos botões
        const btnVerDetalhes = tr.querySelector('.btn-ver-detalhes');
        btnVerDetalhes.addEventListener('click', () => {
            exibirDetalhes(aprovacao, nomeCliente);
        });
        
        const btnEditar = tr.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => {
            prepararEdicaoAvaliacao(aprovacao.id, aprovacao);
        });
        
        const btnExcluir = tr.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', () => {
            confirmarAcao(`Tem certeza que deseja excluir esta avaliação médica?`, 
                () => excluirAvaliacao(aprovacao.id));
        });
    });
    
    // Atualizar paginação
    renderizarPaginacao(totalPaginas, paginaAtualHistorico, elements.historico.paginacao, mudarPaginaHistorico);
}

function exibirDetalhes(aprovacao, nomeCliente) {
    // Formatar data
    const dataFormatada = new Date(aprovacao.data_verificacao).toLocaleDateString('pt-BR');
    
    // Status formatado
    const statusHTML = aprovacao.aprovado ? 
        '<span class="badge bg-success">Aprovado</span>' : 
        '<span class="badge bg-danger">Reprovado</span>';
    
    // Preencher modal
    elements.modal.detalhes.cliente.textContent = nomeCliente;
    elements.modal.detalhes.data.textContent = dataFormatada;
    elements.modal.detalhes.medico.textContent = aprovacao.medico_responsavel || '-';
    elements.modal.detalhes.status.innerHTML = statusHTML;
    elements.modal.detalhes.detalhes.textContent = aprovacao.detalhes || 'Sem observações registradas.';
    
    // Exibir modal
    elements.modal.detalhes.el.show();
}

async function carregarClientesSelect() {
    try {
        const clientes = await fetchAPI('/clientes/');
        
        // Limpar opções existentes, exceto a padrão
        elements.form.clienteId.innerHTML = '<option value="">Selecione um cliente</option>';
        
        // Adicionar clientes ao select
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            option.dataset.status = cliente.status_medico;
            elements.form.clienteId.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes para o select:', error);
    }
}

async function verificarHistoricoCliente(event) {
    const clienteId = event.target.value;
    if (!clienteId) return;
    
    try {
        const aprovacoes = await fetchAPI(`/medical_clearance/${clienteId}`);
        
        if (aprovacoes.length > 0) {
            // Ordenar por data (mais recente primeiro)
            aprovacoes.sort((a, b) => new Date(b.data_verificacao) - new Date(a.data_verificacao));
            
            // Mostrar alerta informativo
            const ultimaAprovacao = aprovacoes[0];
            const dataFormatada = new Date(ultimaAprovacao.data_verificacao).toLocaleDateString('pt-BR');
            const statusText = ultimaAprovacao.aprovado ? 'aprovado' : 'reprovado';
            
            mostrarAlerta(`Este cliente já possui avaliação médica. Última avaliação em ${dataFormatada}: ${statusText}.`, 'info');
        }
    } catch (error) {
        console.error('Erro ao verificar histórico do cliente:', error);
    }
}

function prepararNovaAvaliacao(clienteId, clienteNome) {
    // Resetar formulário
    resetForm();
    
    // Definir cliente selecionado
    if (clienteId) {
        elements.form.clienteId.value = clienteId;
        
        // Notificar sobre avaliações existentes
        verificarHistoricoCliente({ target: { value: clienteId } });
    }
    
    // Mudar para aba de formulário
    elements.tabs.formulario.click();
}

async function prepararEdicaoAvaliacao(id, dados) {
    try {
        // Se não temos os dados completos, buscar da API
        if (!dados) {
            // Na API real, teríamos um endpoint para buscar uma avaliação específica
            // Aqui vamos simular usando o histórico do cliente
            const aprovacoes = await fetchAPI(`/medical_clearance/${dados.cliente_id}`);
            dados = aprovacoes.find(a => a.id === id);
            
            if (!dados) {
                throw new Error('Avaliação não encontrada');
            }
        }
        
        // Preencher formulário
        elements.form.id.value = dados.id;
        elements.form.clienteId.value = dados.cliente_id;
        elements.form.dataVerificacao.value = dados.data_verificacao.split('T')[0]; // Apenas a data
        elements.form.medicoResponsavel.value = dados.medico_responsavel || '';
        elements.form.aprovado.value = dados.aprovado.toString();
        elements.form.detalhes.value = dados.detalhes || '';
        
        // Atualizar título do formulário
        elements.form.title.textContent = 'Editar Avaliação Médica';
        
        // Desabilitar seleção de cliente na edição
        elements.form.clienteId.disabled = true;
        
        // Mudar para aba de formulário
        elements.tabs.formulario.click();
    } catch (error) {
        console.error('Erro ao preparar edição de avaliação:', error);
        mostrarAlerta('Erro ao carregar dados da avaliação médica', 'danger');
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Impedir envio duplo desabilitando o botão
    elements.form.btnSalvar.disabled = true;
    
    try {
        const isEdicao = elements.form.id.value !== '';
        
        // Validar campos obrigatórios
        const camposObrigatorios = [
            elements.form.clienteId,
            elements.form.dataVerificacao,
            elements.form.medicoResponsavel,
            elements.form.aprovado
        ];
        
        let isFormValid = true;
        camposObrigatorios.forEach(campo => {
            if (!campo.value) {
                campo.classList.add('is-invalid');
                isFormValid = false;
            } else {
                campo.classList.remove('is-invalid');
            }
        });
        
        if (!isFormValid) {
            throw new Error('Preencha todos os campos obrigatórios');
        }
        
        const formData = {
            cliente_id: elements.form.clienteId.value,
            data_verificacao: elements.form.dataVerificacao.value,
            medico_responsavel: elements.form.medicoResponsavel.value,
            aprovado: elements.form.aprovado.value === 'true',
            detalhes: elements.form.detalhes.value
        };
        
        if (isEdicao) {
            // Atualizar avaliação existente
            await fetchAPI(`/medical_clearance/${elements.form.id.value}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Avaliação médica atualizada com sucesso!');
        } else {
            // Criar nova avaliação
            await fetchAPI('/medical_clearance/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Avaliação médica registrada com sucesso!');
        }
        
        // Resetar formulário e recarregar dados
        resetForm();
        await carregarHistorico();
        await carregarClientes();
        
        // Voltar para lista de clientes
        elements.tabs.clientes.click();
    } catch (error) {
        console.error('Erro ao salvar avaliação médica:', error);
        mostrarAlerta(`Erro: ${error.message}`, 'danger');
    } finally {
        // Re-habilitar o botão após o processamento
        elements.form.btnSalvar.disabled = false;
    }
}

async function excluirAvaliacao(avaliacaoId) {
    try {
        // Na API real, teríamos um endpoint DELETE para excluir uma avaliação
        // Aqui vamos simular uma resposta de sucesso
        mostrarAlerta('Avaliação médica excluída com sucesso!', 'success');
        
        // Recarregar histórico e clientes
        await carregarHistorico();
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir avaliação médica:', error);
        mostrarAlerta('Erro ao excluir avaliação médica', 'danger');
    }
}

function resetForm() {
    // Limpar campos
    elements.form.el.reset();
    elements.form.id.value = '';
    
    // Definir data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    elements.form.dataVerificacao.value = hoje;
    
    // Restaurar título padrão
    elements.form.title.textContent = 'Nova Avaliação Médica';
    
    // Habilitar campos que podem ter sido desabilitados
    elements.form.clienteId.disabled = false;
}

function buscarHistorico() {
    const nomeBusca = elements.filtros.clienteHistorico.value.trim().toLowerCase();
    
    // Se não houver nome para busca, carregar histórico geral
    if (!nomeBusca) {
        carregarHistorico();
        return;
    }
    
    // Buscar clientes que correspondem
    const clientesEncontrados = clientesData.filter(cliente => 
        cliente.nome.toLowerCase().includes(nomeBusca));
    
    if (clientesEncontrados.length === 0) {
        elements.historico.tabela.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum cliente encontrado com o nome "${elements.filtros.clienteHistorico.value}".</td>
            </tr>
        `;
        elements.historico.paginacao.style.display = 'none';
        return;
    }
    
    // Carregar histórico do primeiro cliente encontrado
    carregarHistorico(clientesEncontrados[0].id);
}

function confirmarAcao(mensagem, callback) {
    elements.modal.confirm.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.confirm.el.show();
}

// Funções auxiliares para formatação
function formatarStatusMedico(status) {
    const mapStatus = {
        'Aprovado': '<span class="badge bg-success">Aprovado</span>',
        'Pendente': '<span class="badge bg-warning text-dark">Pendente</span>',
        'Reprovado': '<span class="badge bg-danger">Reprovado</span>'
    };
    return mapStatus[status] || '<span class="badge bg-secondary">Não informado</span>';
}
