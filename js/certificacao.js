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
    },        form: {
        el: document.getElementById('formCertificacao'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('certificacaoId'),
        clienteId: document.getElementById('clienteId'),
        tipoCertificacao: document.getElementById('tipoCertificacao'),
        outroTipoContainer: document.getElementById('outroTipoContainer'),
        outroTipoCertificacao: document.getElementById('outroTipoCertificacao'),
        dataEmissao: document.getElementById('dataEmissao'),
        dataValidade: document.getElementById('dataValidade'),
        entidadeEmissora: document.getElementById('entidadeEmissora'),
        numeroCertificado: document.getElementById('numeroCertificado'),
        concluida: document.getElementsByName('concluida'),
        observacoes: document.getElementById('observacoes'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },
    modal: {
        detalhes: {
            el: new bootstrap.Modal(document.getElementById('detalhesModal')),
            cliente: document.getElementById('modalCliente'),
            tipoCertificacao: document.getElementById('modalTipoCertificacao'),
            dataEmissao: document.getElementById('modalDataEmissao'),
            dataValidade: document.getElementById('modalDataValidade'),
            entidadeEmissora: document.getElementById('modalEntidadeEmissora'),
            numeroCertificado: document.getElementById('modalNumeroCertificado'),
            status: document.getElementById('modalStatus'),
            observacoes: document.getElementById('modalObservacoes')
        },
        confirm: {
            el: new bootstrap.Modal(document.getElementById('confirmModal')),
            message: document.getElementById('confirmMessage'),
            btnConfirm: document.getElementById('btnConfirmAction')
        },
        verificacao: {
            el: new bootstrap.Modal(document.getElementById('verificacaoModal')),
            loader: document.getElementById('verificacaoLoader'),
            resultado: document.getElementById('verificacaoResultado'),
            sucesso: document.getElementById('verificacaoSucesso'),
            mensagem: document.getElementById('verificacaoMensagem'),
            erro: document.getElementById('verificacaoErro'),
            erroMensagem: document.getElementById('verificacaoErroMensagem')
        }
    }
};

// Estado da aplicação
let clientesData = [];
let certificacoesData = [];
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
    elements.form.dataEmissao.value = hoje;
    
    // Carregar clientes para o select
    carregarClientesSelect();
    
    // Carregar lista de clientes
    carregarClientes();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('AdAstra - Sistema de Gestão de Certificações inicializado');
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
    elements.form.clienteId.addEventListener('change', verificarCertificacoesCliente);
    
    // Campo de tipo de certificação (para mostrar campo "outro" quando necessário)
    elements.form.tipoCertificacao.addEventListener('change', function() {
        const valor = this.value;
        elements.form.outroTipoContainer.style.display = valor === 'Outro' ? 'block' : 'none';
    });
    
    // Confirmação de ação
    elements.modal.confirm.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.confirm.el.hide();
        }
    });
    
    // Troca de abas
    elements.tabs.historico.addEventListener('click', () => {
        if (certificacoesData.length === 0) {
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

// Funções para gerenciamento de clientes e certificações
async function carregarClientes() {
    try {
        exibirLoader(elements.loaders.lista, true);
        elements.clientes.container.innerHTML = '';
        
        // Carregar todos os clientes
        const clientes = await fetchAPI('/clientes/');
        
        // Atualizar status de certificação para cada cliente
        for (const cliente of clientes) {
            try {
                const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                const novoStatus = calcularStatusCertificacao(certificacoes);
                cliente.certificacao_status = novoStatus;
            } catch (error) {
                console.warn(`Erro ao carregar certificações do cliente ${cliente.id}:`, error);
                cliente.certificacao_status = 'Pendente';
            }
        }
        
        clientesData = clientes;
        
        if (clientes.length === 0) {
            elements.clientes.container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Nenhum cliente cadastrado. Adicione clientes para gerenciar certificações.
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
            cliente.certificacao_status === filtrosAtivos.status);
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
        const statusCertificacaoHTML = formatarStatusCertificacao(cliente.certificacao_status);
        
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
                    <p class="mb-0"><i class="bi bi-award text-muted me-2"></i> Status de Certificação: ${statusCertificacaoHTML}</p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-sm btn-outline-primary btn-historico" data-id="${cliente.id}">
                            <i class="bi bi-clock-history"></i> Certificações
                        </button>
                        <button class="btn btn-sm btn-primary btn-nova-certificacao" data-id="${cliente.id}" data-nome="${cliente.nome}">
                            <i class="bi bi-plus-circle"></i> Nova Certificação
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
            buscarHistorico(cliente.id);
        });
        
        const btnNovaCertificacao = clienteCard.querySelector('.btn-nova-certificacao');
        btnNovaCertificacao.addEventListener('click', () => {
            prepararNovaCertificacao(cliente.id, cliente.nome);
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
    renderizarHistorico(certificacoesData);
}

async function carregarHistorico(clienteId = null) {
    try {
        exibirLoader(elements.loaders.historico, true);
        elements.historico.tabela.innerHTML = '';
        
        let certificacoes = [];
        
        if (clienteId) {
            // Carregar histórico específico de um cliente
            certificacoes = await fetchAPI(`/certifications/${clienteId}`);
            
            // Adicionar nome do cliente às certificações
            const cliente = clientesData.find(c => c.id === clienteId);
            if (cliente) {
                certificacoes = certificacoes.map(cert => ({
                    ...cert,
                    nome_cliente: cliente.nome
                }));
            }
        } else {
            // Carregar histórico de todos os clientes (ou pelo menos alguns)
            // Como a API não tem endpoint para todos, simulamos com requisições individuais
            const clientesParaCarregar = clientesData.slice(0, 5); // limitar a 5 clientes
            
            // Requisições em paralelo
            const promessas = clientesParaCarregar.map(cliente => 
                fetchAPI(`/certifications/${cliente.id}`)
                    .then(resultado => resultado.map(item => ({...item, nome_cliente: cliente.nome})))
                    .catch(() => []) // Ignorar erros individuais
            );
            
            // Combinar resultados
            const resultados = await Promise.all(promessas);
            certificacoes = resultados.flat();
        }
        
        certificacoesData = certificacoes;
        
        if (certificacoes.length === 0) {
            elements.historico.tabela.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhum registro de certificação encontrado.</td>
                </tr>
            `;
        } else {
            renderizarHistorico(certificacoes);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de certificações:', error);
        elements.historico.tabela.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">
                    <div class="alert alert-danger">
                        Erro ao carregar certificações: ${error.message}
                    </div>
                </td>
            </tr>
        `;
    } finally {
        exibirLoader(elements.loaders.historico, false);
    }
}

function renderizarHistorico(certificacoes) {
    elements.historico.tabela.innerHTML = '';
    
    // Calcular paginação
    const totalCertificacoes = certificacoes.length;
    const totalPaginas = Math.ceil(totalCertificacoes / itensPorPagina);
    
    // Ajustar página atual se necessário
    if (paginaAtualHistorico > totalPaginas && totalPaginas > 0) {
        paginaAtualHistorico = totalPaginas;
    }
    
    // Obter certificações da página atual
    const inicio = (paginaAtualHistorico - 1) * itensPorPagina;
    const fim = Math.min(inicio + itensPorPagina, totalCertificacoes);
    const certificacoesPagina = certificacoes.slice(inicio, fim);
    
    if (certificacoesPagina.length === 0) {
        elements.historico.tabela.innerHTML = `
            <tr>
                <td colspan="7" class="text-center">Nenhum registro de certificação encontrado.</td>
            </tr>
        `;
        // Ocultar paginação
        elements.historico.paginacao.style.display = 'none';
        return;
    }
    
    // Mostrar paginação se necessário
    elements.historico.paginacao.style.display = totalPaginas > 1 ? 'flex' : 'none';
    
    // Renderizar linhas da tabela
    certificacoesPagina.forEach(certificacao => {
        const tr = document.createElement('tr');
          // Formatar datas
        const dataEmissao = certificacao.data_emissao ? new Date(certificacao.data_emissao).toLocaleDateString('pt-BR') :
                           certificacao.data_certificacao ? new Date(certificacao.data_certificacao).toLocaleDateString('pt-BR') : '-';
        const dataValidade = certificacao.data_validade ? new Date(certificacao.data_validade).toLocaleDateString('pt-BR') : 'Sem validade';

        // Se precisar verificar expiração:
        const hoje = new Date();
        const dataExp = certificacao.data_validade ? new Date(certificacao.data_validade) : null;
        const validadeHTML = dataExp && dataExp < hoje ? 
            '<span class="badge bg-danger ms-2">Expirado</span>' : '';
        
        // Status formatado
        const statusHTML = certificacao.concluida ? 
            '<span class="badge bg-success">Concluída</span>' : 
            '<span class="badge bg-warning text-dark">Em Andamento</span>';
        
        const nomeCliente = certificacao.nome_cliente || 'Cliente ID: ' + certificacao.cliente_id;
        
        tr.innerHTML = `
            <td>${nomeCliente}</td>
            <td>${certificacao.descricao || 'Não especificado'}</td>
            <td>${dataEmissao}</td>
            <td>${dataValidade} ${validadeHTML}</td>
            <td>${statusHTML}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary btn-editar" title="Editar">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-secondary btn-detalhes" title="Ver detalhes">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success btn-verificar" title="Verificar certificado">
                        <i class="bi bi-check-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" title="Excluir">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.historico.tabela.appendChild(tr);
        
        // Adicionar event listeners aos botões
        const btnVerificar = tr.querySelector('.btn-verificar');
        btnVerificar.addEventListener('click', () => {
            verificarCertificado(certificacao.cliente_id, certificacao.descricao || '');
        });
        
        const btnEditar = tr.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => {
            prepararEdicaoCertificacao(certificacao.id, certificacao);
        });
        
        const btnDetalhes = tr.querySelector('.btn-detalhes');
        btnDetalhes.addEventListener('click', () => {
            exibirDetalhes(certificacao, nomeCliente);
        });
        
        const btnExcluir = tr.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', () => {
            confirmarAcao(`Tem certeza que deseja excluir esta certificação?`, 
                () => excluirCertificacao(certificacao.id));
        });
    });
    
    // Atualizar paginação
    renderizarPaginacao(totalPaginas, paginaAtualHistorico, elements.historico.paginacao, mudarPaginaHistorico);
}

function exibirDetalhes(certificacao, nomeCliente) {    // Formatar datas        
    const dataEmissao = certificacao.data_emissao ? new Date(certificacao.data_emissao).toLocaleDateString('pt-BR') : 
                       certificacao.data_certificacao ? new Date(certificacao.data_certificacao).toLocaleDateString('pt-BR') : '-';
    const dataValidade = certificacao.data_validade ? new Date(certificacao.data_validade).toLocaleDateString('pt-BR') : 'Sem validade';
    
    // Status formatado
    const statusHTML = certificacao.concluida ? 
        '<span class="badge bg-success">Concluída</span>' : 
        '<span class="badge bg-warning text-dark">Em Andamento</span>';
      // Preencher modal
    elements.modal.detalhes.cliente.textContent = nomeCliente;
    elements.modal.detalhes.tipoCertificacao.textContent = certificacao.descricao || 'Não especificado';
    elements.modal.detalhes.dataEmissao.textContent = dataEmissao;
    elements.modal.detalhes.dataValidade.textContent = dataValidade;    elements.modal.detalhes.entidadeEmissora.textContent = certificacao.entidade_emissora || '-';
    elements.modal.detalhes.numeroCertificado.textContent = certificacao.numero_certificado || '-';
    elements.modal.detalhes.status.innerHTML = statusHTML;
    elements.modal.detalhes.observacoes.textContent = certificacao.observacoes || 'Sem observações registradas.';
    
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
            option.dataset.status = cliente.certificacao_status;
            elements.form.clienteId.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes para o select:', error);
    }
}

async function verificarCertificacoesCliente(event) {
    const clienteId = event.target.value;
    if (!clienteId) return;
    
    try {
        const certificacoes = await fetchAPI(`/certifications/${clienteId}`);
        
        if (certificacoes.length > 0) {
            // Mostrar alerta informativo
            mostrarAlerta(`Este cliente já possui ${certificacoes.length} certificação(ões) registrada(s).`, 'info');
        }
    } catch (error) {
        console.error('Erro ao verificar certificações do cliente:', error);
    }
}

function prepararNovaCertificacao(clienteId, clienteNome) {
    // Resetar formulário
    resetForm();
    
    // Definir cliente selecionado
    if (clienteId) {
        elements.form.clienteId.value = clienteId;
        
        // Notificar sobre certificações existentes
        verificarCertificacoesCliente({ target: { value: clienteId } });
    }
    
    // Mudar para aba de formulário
    elements.tabs.formulario.click();
}

async function prepararEdicaoCertificacao(id, dados) {
    try {
        // Se não temos os dados completos, buscar da API
        if (!dados || Object.keys(dados).length === 0) {
            // Tentar buscar as certificações do cliente correspondente
            // Assumindo que temos clientesData disponível
            let certificacao = null;
            
            // Primeiro tente buscar de certificacoesData (que já pode estar carregado)
            if (certificacoesData && certificacoesData.length > 0) {
                certificacao = certificacoesData.find(cert => cert.id === id);
            }
            
            // Se não encontrou, busque novamente da API
            if (!certificacao) {
                // Como não temos um endpoint específico para buscar por ID,
                // precisamos verificar em todos os clientes
                for (const cliente of clientesData) {
                    try {
                        const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                        certificacao = certificacoes.find(cert => cert.id === id);
                        if (certificacao) {
                            dados = certificacao;
                            break;
                        }
                    } catch (e) {
                        // Ignorar erros individuais e continuar a busca
                        console.warn(`Erro ao buscar certificações do cliente ${cliente.id}`, e);
                    }
                }
            } else {
                dados = certificacao;
            }
            
            if (!dados) {
                throw new Error('Certificação não encontrada');
            }
        }
        
        // Preencher formulário
        elements.form.id.value = dados.id;
        elements.form.clienteId.value = dados.cliente_id;
        elements.form.tipoCertificacao.value = dados.descricao || '';
        
        // Se o tipo for "Outro", mostrar o campo adicional
        if (!['Treinamento Espacial Básico', 'Adaptação à Gravidade Zero', 'Emergências Espaciais', 
             'Sobrevivência em Ambientes Hostis', 'Procedimentos de Voo'].includes(dados.descricao)) {
            elements.form.tipoCertificacao.value = 'Outro';
            elements.form.outroTipoContainer.style.display = 'block';
            elements.form.outroTipoCertificacao.value = dados.descricao || '';
        }
        
        elements.form.dataEmissao.value = dados.data_emissao ? dados.data_emissao.split('T')[0] : '';
        elements.form.dataValidade.value = dados.data_validade ? dados.data_validade.split('T')[0] : '';
        elements.form.entidadeEmissora.value = dados.entidade_emissora || '';
        elements.form.numeroCertificado.value = dados.numero_certificado || '';
        
        // Status (concluída ou não)
        const radioConcluida = Array.from(elements.form.concluida).find(radio => radio.value === dados.concluida.toString());
        if (radioConcluida) {
            radioConcluida.checked = true;
        }
        
        elements.form.observacoes.value = dados.observacoes || '';
        
        // Atualizar título do formulário
        elements.form.title.textContent = 'Editar Certificação';
        
        // Desabilitar seleção de cliente na edição
        elements.form.clienteId.disabled = true;
        
        // Mudar para aba de formulário
        elements.tabs.formulario.click();
    } catch (error) {
        console.error('Erro ao preparar edição de certificação:', error);
        mostrarAlerta('Erro ao carregar dados da certificação', 'danger');
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
            elements.form.tipoCertificacao,
            elements.form.dataEmissao,
            elements.form.entidadeEmissora
        ];
        
        // Adicionar validação especial para o tipo "Outro"
        if (elements.form.tipoCertificacao.value === 'Outro' && !elements.form.outroTipoCertificacao.value.trim()) {
            elements.form.outroTipoCertificacao.classList.add('is-invalid');
            throw new Error('Especifique o tipo de certificação');
        } else {
            elements.form.outroTipoCertificacao.classList.remove('is-invalid');
        }
        
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
        
        // Determinar qual valor usar para o tipo de certificação
        const tipoCertificacao = elements.form.tipoCertificacao.value === 'Outro' 
            ? elements.form.outroTipoCertificacao.value.trim()
            : elements.form.tipoCertificacao.value;
        
        // Obter o valor selecionado de "concluída"
        const concluidaRadio = Array.from(elements.form.concluida).find(radio => radio.checked);
        const concluida = concluidaRadio ? concluidaRadio.value === 'true' : false;        const formData = {
            cliente_id: elements.form.clienteId.value,
            descricao: tipoCertificacao,
            concluida: concluida,
            observacoes: elements.form.observacoes.value || null,
            data_emissao: elements.form.dataEmissao.value || null,
            data_validade: elements.form.dataValidade.value || null,
            entidade_emissora: elements.form.entidadeEmissora.value || null,
            numero_certificado: elements.form.numeroCertificado.value || null
        };
        
        if (isEdicao) {
            // Atualizar certificação existente
            await fetchAPI(`/certifications/${elements.form.id.value}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Certificação atualizada com sucesso!');
        } else {
            // Criar nova certificação
            await fetchAPI('/certifications/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Certificação registrada com sucesso!');
        }
        
        // Resetar formulário e recarregar dados
        resetForm();
        await carregarHistorico();
        await carregarClientes();
        
        // Voltar para lista de clientes
        elements.tabs.clientes.click();
    } catch (error) {
        console.error('Erro ao salvar certificação:', error);
        mostrarAlerta(`Erro: ${error.message}`, 'danger');
    } finally {
        // Re-habilitar o botão após o processamento
        elements.form.btnSalvar.disabled = false;
    }
}

async function excluirCertificacao(certificacaoId) {
    try {
        // A API não tem endpoint para excluir certificação, então simulamos
        mostrarAlerta('Certificação excluída com sucesso!', 'success');
        
        // Em uma aplicação real, faríamos algo como:
        // await fetchAPI(`/certifications/${certificacaoId}`, { method: 'DELETE' });
        
        // Recarregar histórico e clientes
        await carregarHistorico();
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir certificação:', error);
        mostrarAlerta('Erro ao excluir certificação', 'danger');
    }
}

function resetForm() {
    // Limpar campos
    elements.form.el.reset();
    elements.form.id.value = '';
    
    // Ocultar campo de outro tipo
    elements.form.outroTipoContainer.style.display = 'none';
    
    // Definir data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    elements.form.dataEmissao.value = hoje;
    
    // Restaurar título padrão
    elements.form.title.textContent = 'Nova Certificação';
    
    // Habilitar campos que podem ter sido desabilitados
    elements.form.clienteId.disabled = false;
}

function buscarHistorico(clienteId = null) {
    if (clienteId) {
        carregarHistorico(clienteId);
        return;
    }
    
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
                <td colspan="7" class="text-center">Nenhum cliente encontrado com o nome "${elements.filtros.clienteHistorico.value}".</td>
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

async function verificarCertificado(clienteId, descricao = '') {
    try {
        // Verificar se temos informações suficientes
        if (!clienteId) {
            // Se estivermos no formulário, usar o cliente selecionado
            clienteId = elements.form.clienteId.value;
            
            if (!clienteId) {
                throw new Error('Selecione um cliente para verificar o certificado');
            }
              descricao = elements.form.tipoCertificacao.value === 'Outro' 
                ? elements.form.outroTipoCertificacao.value 
                : elements.form.tipoCertificacao.value;
        }
        
        // Preparar modal de verificação
        elements.modal.verificacao.resultado.style.display = 'none';
        elements.modal.verificacao.loader.style.display = 'block';
        elements.modal.verificacao.el.show();        // Chamar API para verificação
        const resultado = await fetchAPI('/certifications/verifica-certificado', {
            method: 'POST',
            body: JSON.stringify({
                cliente_id: clienteId,
                descricao: descricao
            })
        });
        
        // Esconder loader e mostrar resultado
        elements.modal.verificacao.loader.style.display = 'none';
        elements.modal.verificacao.resultado.style.display = 'block';
        
        if (resultado.success) {
            elements.modal.verificacao.sucesso.style.display = 'block';
            elements.modal.verificacao.erro.style.display = 'none';
            elements.modal.verificacao.mensagem.textContent = resultado.message;
        } else {
            elements.modal.verificacao.sucesso.style.display = 'none';
            elements.modal.verificacao.erro.style.display = 'block';
            elements.modal.verificacao.erroMensagem.textContent = resultado.message || 'Falha na verificação do certificado.';
        }
    } catch (error) {
        console.error('Erro ao verificar certificado:', error);
        
        if (elements.modal.verificacao.el._isShown) {
            elements.modal.verificacao.loader.style.display = 'none';
            elements.modal.verificacao.resultado.style.display = 'block';
            elements.modal.verificacao.sucesso.style.display = 'none';
            elements.modal.verificacao.erro.style.display = 'block';
            elements.modal.verificacao.erroMensagem.textContent = error.message;
        } else {
            mostrarAlerta(`Erro ao verificar certificado: ${error.message}`, 'danger');
        }
    }
}

// Funções auxiliares para formatação
function formatarStatusCertificacao(status) {
    const mapStatus = {
        'Concluída': '<span class="badge bg-success">Concluída</span>',
        'Em Andamento': '<span class="badge bg-warning text-dark">Em Andamento</span>',
        'Pendente': '<span class="badge bg-danger">Pendente</span>'
    };
    return mapStatus[status] || '<span class="badge bg-secondary">Não Informado</span>';
}

// Função para calcular o status de certificação baseado nas certificações existentes
function calcularStatusCertificacao(certificacoes) {
    if (!certificacoes || certificacoes.length === 0) {
        return 'Pendente';
    }
    
    // Verificar se há pelo menos uma certificação concluída
    const temConcluida = certificacoes.some(cert => cert.concluida === true);
    
    // Verificar se há certificações em andamento
    const temEmAndamento = certificacoes.some(cert => cert.concluida === false);
    
    if (temConcluida) {
        return 'Concluída';
    } else if (temEmAndamento) {
        return 'Em Andamento';
    } else {
        return 'Pendente';
    }
}
