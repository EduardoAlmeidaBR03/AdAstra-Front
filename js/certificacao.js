// certificacao.js - Sistema de Gerenciamento de Certificações Ad Astra

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
        certificacaoConcluida: document.getElementById('certificacaoConcluida'),
        certificacaoNaoConcluida: document.getElementById('certificacaoNaoConcluida'),
        observacoes: document.getElementById('observacoes'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar'),
        errorArea: document.getElementById('formErrorArea')
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
            erro: document.getElementById('verificacaoErro'),
            mensagem: document.getElementById('verificacaoMensagem'),
            erroMensagem: document.getElementById('verificacaoErroMensagem')
        }
    }
};

// Estado da aplicação
let clientesData = [];
let certificacoesData = [];
let acaoConfirmacao = null;
let certificacaoAtual = null;
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
    
    // Carregar dados iniciais
    carregarClientesSelect();
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
    
    // Campo de tipo de certificação personalizado
    elements.form.tipoCertificacao.addEventListener('change', toggleOutroTipo);
    
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
    if (loader) {
        loader.style.display = show ? 'inline-block' : 'none';
    }
}

function mostrarAlerta(mensagem, tipo = 'success', duracao = 5000) {
    const alertContainer = document.querySelector('.alert-container');
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    alertContainer.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, duracao);
}

function toggleOutroTipo() {
    const valor = elements.form.tipoCertificacao.value;
    elements.form.outroTipoContainer.style.display = valor === 'Outro' ? 'block' : 'none';
    if (valor !== 'Outro') {
        elements.form.outroTipoCertificacao.value = '';
    }
}

// Funções para comunicação com a API
async function fetchAPI(endpoint, options = {}) {
    try {
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
        
        if (options.method === 'DELETE') {
            console.log('Response: Success (DELETE operation)');
            console.groupEnd();
            return { success: response.ok };
        }
        
        if (!response.ok) {
            let errorMessage = `Erro HTTP ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.detail || errorMessage;
                console.error('Response Error Details:', errorData);
            } catch (e) {
                console.error('Could not parse error response as JSON');
            }
            
            console.groupEnd();
            throw new Error(errorMessage);
        }
        
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
        
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            mostrarAlerta('Erro de conexão. Verifique se o servidor da API está acessível.', 'danger');
        } else {
            mostrarAlerta(`Erro: ${error.message}`, 'danger');
        }
        
        console.groupEnd();
        throw error;
    }
}

// Funções para gerenciamento de clientes e certificações
async function carregarClientes() {
    try {
        exibirLoader(elements.loaders.lista, true);
        elements.clientes.container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-info">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Carregando...</span>
                    </div>
                    Carregando clientes e status de certificações...
                </div>
            </div>
        `;
        
        const clientes = await fetchAPI('/clientes/');
          // Carregar certificações para cada cliente e calcular o status
        const clientesComStatus = await Promise.all(
            clientes.map(async (cliente) => {
                try {
                    const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                    cliente.certificacao_status = calcularStatusCertificacao(certificacoes, cliente.nome);
                    return cliente;
                } catch (error) {
                    console.warn(`Erro ao carregar certificações do cliente ${cliente.id}:`, error);
                    cliente.certificacao_status = 'Pendente';
                    return cliente;
                }
            })
        );
        
        clientesData = clientesComStatus;
        
        if (clientesComStatus.length === 0) {
            elements.clientes.container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Nenhum cliente cadastrado. Adicione clientes para gerenciar certificações.
                    </div>
                </div>
            `;
        } else {
            renderizarClientes(filtrarClientes(clientesComStatus));
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        elements.clientes.container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    Erro ao carregar clientes. Por favor, tente novamente.
                </div>
            </div>
        `;
    } finally {
        exibirLoader(elements.loaders.lista, false);
    }
}

// Nova função para calcular o status de certificação baseado nas certificações existentes
function calcularStatusCertificacao(certificacoes, nomeCliente = null) {
    console.group(`Calculando status para ${nomeCliente || 'cliente'}`);
    console.log('Certificações recebidas:', certificacoes);
    
    if (!certificacoes || certificacoes.length === 0) {
        console.log('Resultado: Pendente (sem certificações)');
        console.groupEnd();
        return 'Pendente';
    }
    
    console.log('Total de certificações:', certificacoes.length);
    
    // Função robusta para normalizar o valor de "concluida"
    function normalizarConcluida(valor) {
        console.log('  Normalizando valor:', valor, 'tipo:', typeof valor);
        
        // Valores que indicam "concluída"
        const valoresConcluida = [
            true, 'true', 'TRUE', 'True',
            1, '1',
            'S', 's', 'Sim', 'sim', 'SIM',
            'Y', 'y', 'Yes', 'yes', 'YES'
        ];
        
        // Valores que indicam "não concluída"
        const valoresNaoConcluida = [
            false, 'false', 'FALSE', 'False',
            0, '0',
            'N', 'n', 'Não', 'não', 'NAO', 'Nao', 'nao',
            'No', 'no', 'NO'
        ];
        
        if (valoresConcluida.includes(valor)) {
            console.log('  -> Interpretado como CONCLUÍDA');
            return true;
        } else if (valoresNaoConcluida.includes(valor)) {
            console.log('  -> Interpretado como NÃO CONCLUÍDA');
            return false;
        } else {
            console.warn('  -> Valor não reconhecido para concluida:', valor, 'assumindo como NÃO CONCLUÍDA');
            return false; // Padrão: não concluída
        }
    }
    
    // Analisar cada certificação em detalhes
    let certificacoesConcluidas = 0;
    let certificacoesEmAndamento = 0;
    
    certificacoes.forEach((cert, index) => {
        console.log(`Certificação ${index + 1}:`, {
            id: cert.id,
            descricao: cert.descricao,
            concluida: cert.concluida,
            tipo_concluida: typeof cert.concluida,
            data_emissao: cert.data_emissao,
            cliente_id: cert.cliente_id
        });
        
        const isConcluida = normalizarConcluida(cert.concluida);
        
        if (isConcluida) {
            certificacoesConcluidas++;
        } else {
            certificacoesEmAndamento++;
        }
    });
    
    console.log('Análise final:', {
        certificacoesConcluidas,
        certificacoesEmAndamento,
        totalCertificacoes: certificacoes.length
    });
    
    let status;
    if (certificacoesConcluidas > 0 && certificacoesEmAndamento === 0) {
        status = 'Concluída';
    } else if (certificacoesConcluidas > 0 || certificacoesEmAndamento > 0) {
        status = 'Em Andamento';
    } else {
        status = 'Pendente';
    }
    
    console.log('Status calculado:', status);
    console.groupEnd();
    return status;
}

function filtrarClientes(clientes) {
    let clientesFiltrados = [...clientes];
    
    // Aplicar filtro de status de certificação
    if (filtrosAtivos.status) {
        clientesFiltrados = clientesFiltrados.filter(cliente => {
            const statusCertificacao = cliente.certificacao_status || 'Pendente';
            return statusCertificacao === filtrosAtivos.status;
        });
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
    const totalPaginas = Math.ceil(clientes.length / itensPorPagina);
    const inicio = (paginaAtualClientes - 1) * itensPorPagina;
    const clientesPagina = clientes.slice(inicio, inicio + itensPorPagina);
    
    elements.clientes.container.innerHTML = '';
    
    clientesPagina.forEach(cliente => {
        const statusCertificacao = cliente.certificacao_status || 'Pendente';
        const badgeClass = getBadgeClass(statusCertificacao);
        
        const clienteCard = document.createElement('div');
        clienteCard.className = 'col-md-4 mb-3';
        clienteCard.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${cliente.nome}</h5>
                    <p class="card-text">
                        <strong>Email:</strong> ${cliente.email}<br>
                        <strong>País:</strong> ${cliente.pais}
                    </p>
                    <div class="mb-2">
                        <span class="badge ${badgeClass}">${statusCertificacao}</span>
                    </div>
                    <div class="btn-group w-100" role="group">
                        <button class="btn btn-sm btn-outline-primary btn-certificacoes" 
                                data-id="${cliente.id}" data-nome="${cliente.nome}">
                            <i class="bi bi-award"></i> Certificações
                        </button>
                        <button class="btn btn-sm btn-primary btn-nova-certificacao" 
                                data-id="${cliente.id}" data-nome="${cliente.nome}">
                            <i class="bi bi-plus-circle"></i> Nova
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        elements.clientes.container.appendChild(clienteCard);
        
        // Adicionar event listeners aos botões
        const btnCertificacoes = clienteCard.querySelector('.btn-certificacoes');
        btnCertificacoes.addEventListener('click', () => {
            buscarCertificacoesCliente(cliente.id, cliente.nome);
        });
        
        const btnNova = clienteCard.querySelector('.btn-nova-certificacao');
        btnNova.addEventListener('click', () => {
            prepararNovaCertificacao(cliente.id, cliente.nome);
        });
    });
    
    renderizarPaginacao(totalPaginas, paginaAtualClientes, elements.clientes.paginacao, mudarPaginaClientes);
}

function renderizarPaginacao(totalPaginas, paginaAtual, elementoPaginacao, callbackPagina) {
    elementoPaginacao.innerHTML = '';
    
    if (totalPaginas <= 1) return;
    
    // Botão anterior
    const btnAnterior = document.createElement('li');
    btnAnterior.className = `page-item ${paginaAtual === 1 ? 'disabled' : ''}`;
    btnAnterior.innerHTML = `<a class="page-link" href="#">Anterior</a>`;
    btnAnterior.addEventListener('click', (e) => {
        e.preventDefault();
        if (paginaAtual > 1) callbackPagina(paginaAtual - 1);
    });
    elementoPaginacao.appendChild(btnAnterior);
    
    // Números das páginas
    for (let i = 1; i <= totalPaginas; i++) {
        const btnPagina = document.createElement('li');
        btnPagina.className = `page-item ${i === paginaAtual ? 'active' : ''}`;
        btnPagina.innerHTML = `<a class="page-link" href="#">${i}</a>`;
        btnPagina.addEventListener('click', (e) => {
            e.preventDefault();
            callbackPagina(i);
        });
        elementoPaginacao.appendChild(btnPagina);
    }
    
    // Botão próximo
    const btnProximo = document.createElement('li');
    btnProximo.className = `page-item ${paginaAtual === totalPaginas ? 'disabled' : ''}`;
    btnProximo.innerHTML = `<a class="page-link" href="#">Próximo</a>`;
    btnProximo.addEventListener('click', (e) => {
        e.preventDefault();
        if (paginaAtual < totalPaginas) callbackPagina(paginaAtual + 1);
    });
    elementoPaginacao.appendChild(btnProximo);
}

function mudarPaginaClientes(novaPagina) {
    paginaAtualClientes = novaPagina;
    renderizarClientes(filtrarClientes(clientesData));
}

function mudarPaginaHistorico(novaPagina) {
    paginaAtualHistorico = novaPagina;
    renderizarHistorico(certificacoesData);
}

function getBadgeClass(status) {
    switch (status) {
        case 'Concluída':
            return 'bg-success';
        case 'Em Andamento':
            return 'bg-warning text-dark';
        case 'Pendente':
        default:
            return 'bg-secondary';
    }
}

async function buscarCertificacoesCliente(clienteId, nomeCliente) {
    try {
        const certificacoes = await fetchAPI(`/certifications/${clienteId}`);
        
        if (certificacoes.length === 0) {
            mostrarAlerta(`Nenhuma certificação encontrada para ${nomeCliente}`, 'info');
        } else {
            elements.tabs.historico.click();
            elements.filtros.clienteHistorico.value = nomeCliente;
            buscarHistorico();
        }
    } catch (error) {
        console.error('Erro ao buscar certificações do cliente:', error);
    }
}

function prepararNovaCertificacao(clienteId, nomeCliente) {
    resetForm();
    elements.form.clienteId.value = clienteId;
    elements.form.title.textContent = `Nova Certificação - ${nomeCliente}`;
    elements.tabs.formulario.click();
}

async function carregarHistorico(clienteId = null) {
    try {
        exibirLoader(elements.loaders.historico, true);
        elements.historico.tabela.innerHTML = '';
        
        let certificacoes = [];
        
        if (clienteId) {
            // Carregar certificações específicas de um cliente
            certificacoes = await fetchAPI(`/certifications/${clienteId}`);
        } else {
            // Carregar certificações de todos os clientes
            const clientes = await fetchAPI('/clientes/');
            const promessas = clientes.map(cliente => 
                fetchAPI(`/certifications/${cliente.id}`)
                    .then(resultado => resultado.map(item => ({ ...item, nome_cliente: cliente.nome })))
                    .catch(() => [])
            );
            
            const resultados = await Promise.all(promessas);
            certificacoes = resultados.flat();
        }
        
        certificacoesData = certificacoes;
        
        if (certificacoes.length === 0) {
            elements.historico.tabela.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Nenhuma certificação encontrada.</td>
                </tr>
            `;
        } else {
            renderizarHistorico(certificacoes);
        }
    } catch (error) {
        console.error('Erro ao carregar histórico de certificações:', error);
    } finally {
        exibirLoader(elements.loaders.historico, false);
    }
}

function renderizarHistorico(certificacoes) {
    const totalPaginas = Math.ceil(certificacoes.length / itensPorPagina);
    const inicio = (paginaAtualHistorico - 1) * itensPorPagina;
    const certificacoesPagina = certificacoes.slice(inicio, inicio + itensPorPagina);
    
    elements.historico.tabela.innerHTML = '';
    
    certificacoesPagina.forEach(certificacao => {
        const statusBadge = certificacao.concluida ? 
            '<span class="badge bg-success">Concluída</span>' : 
            '<span class="badge bg-warning text-dark">Em Andamento</span>';
        
        const dataValidade = certificacao.data_validade ? 
            new Date(certificacao.data_validade).toLocaleDateString('pt-BR') : 
            'Sem expiração';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${certificacao.nome_cliente || 'N/A'}</td>
            <td>${certificacao.descricao}</td>
            <td>${new Date(certificacao.data_emissao).toLocaleDateString('pt-BR')}</td>
            <td>${dataValidade}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-outline-info btn-verificar" 
                        data-id="${certificacao.id}" data-cliente-id="${certificacao.cliente_id}"
                        data-descricao="${certificacao.descricao}">
                    <i class="bi bi-shield-check"></i> Verificar
                </button>
            </td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary btn-detalhes" 
                            data-certificacao='${JSON.stringify(certificacao)}'>
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning btn-editar" 
                            data-certificacao='${JSON.stringify(certificacao)}'>
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" 
                            data-id="${certificacao.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.historico.tabela.appendChild(row);
        
        // Event listeners para os botões da linha
        const btnDetalhes = row.querySelector('.btn-detalhes');
        btnDetalhes.addEventListener('click', () => {
            exibirDetalhesCertificacao(certificacao);
        });
        
        const btnEditar = row.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => {
            prepararEdicaoCertificacao(certificacao);
        });
        
        const btnExcluir = row.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', () => {
            confirmarExclusao(certificacao.id);
        });
        
        const btnVerificar = row.querySelector('.btn-verificar');
        btnVerificar.addEventListener('click', () => {
            verificarCertificado(certificacao.cliente_id, certificacao.descricao);
        });
    });
    
    renderizarPaginacao(totalPaginas, paginaAtualHistorico, elements.historico.paginacao, mudarPaginaHistorico);
}

function exibirDetalhesCertificacao(certificacao) {
    // Buscar dados do cliente para exibir o nome
    fetchAPI(`/clientes/${certificacao.cliente_id}`)
        .then(cliente => {
            elements.modal.detalhes.cliente.textContent = cliente.nome;
        })
        .catch(() => {
            elements.modal.detalhes.cliente.textContent = 'Cliente não encontrado';
        });
    
    elements.modal.detalhes.tipoCertificacao.textContent = certificacao.descricao;
    elements.modal.detalhes.dataEmissao.textContent = new Date(certificacao.data_emissao).toLocaleDateString('pt-BR');
    elements.modal.detalhes.dataValidade.textContent = certificacao.data_validade ? 
        new Date(certificacao.data_validade).toLocaleDateString('pt-BR') : 'Sem expiração';
    elements.modal.detalhes.entidadeEmissora.textContent = certificacao.entidade_emissora || 'N/A';
    elements.modal.detalhes.numeroCertificado.textContent = certificacao.numero_certificado || 'N/A';
    elements.modal.detalhes.status.innerHTML = certificacao.concluida ? 
        '<span class="badge bg-success">Concluída</span>' : 
        '<span class="badge bg-warning text-dark">Em Andamento</span>';
    elements.modal.detalhes.observacoes.textContent = certificacao.observacoes || 'Nenhuma observação.';
    
    elements.modal.detalhes.el.show();
}

async function carregarClientesSelect() {
    try {
        const clientes = await fetchAPI('/clientes/');
        
        elements.form.clienteId.innerHTML = '<option value="">Selecione um cliente</option>';
        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = cliente.nome;
            elements.form.clienteId.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar clientes para o select:', error);
    }
}

function buscarHistorico() {
    const filtroCliente = elements.filtros.clienteHistorico.value.toLowerCase();
    
    if (filtroCliente) {
        const certificacoesFiltradas = certificacoesData.filter(cert => 
            cert.nome_cliente && cert.nome_cliente.toLowerCase().includes(filtroCliente)
        );
        renderizarHistorico(certificacoesFiltradas);
    } else {
        renderizarHistorico(certificacoesData);
    }
}

function prepararEdicaoCertificacao(certificacao) {
    certificacaoAtual = certificacao;
    
    elements.form.title.textContent = 'Editar Certificação';
    elements.form.id.value = certificacao.id;
    elements.form.clienteId.value = certificacao.cliente_id;
    elements.form.tipoCertificacao.value = 'Outro';
    elements.form.outroTipoCertificacao.value = certificacao.descricao;
    elements.form.dataEmissao.value = certificacao.data_emissao ? certificacao.data_emissao.split('T')[0] : '';
    elements.form.dataValidade.value = certificacao.data_validade ? certificacao.data_validade.split('T')[0] : '';
    elements.form.entidadeEmissora.value = certificacao.entidade_emissora || '';
    elements.form.numeroCertificado.value = certificacao.numero_certificado || '';
    elements.form.observacoes.value = certificacao.observacoes || '';
    
    if (certificacao.concluida) {
        elements.form.certificacaoConcluida.checked = true;
    } else {
        elements.form.certificacaoNaoConcluida.checked = true;
    }
    
    toggleOutroTipo();
    elements.tabs.formulario.click();
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validação básica
    if (!elements.form.clienteId.value) {
        mostrarAlerta('Selecione um cliente', 'danger');
        return;
    }
    
    const tipoCertificacao = elements.form.tipoCertificacao.value === 'Outro' ? 
        elements.form.outroTipoCertificacao.value : 
        elements.form.tipoCertificacao.value;
    
    if (!tipoCertificacao) {
        mostrarAlerta('Informe o tipo de certificação', 'danger');
        return;
    }
    
    const certificacaoData = {
        cliente_id: elements.form.clienteId.value,
        descricao: tipoCertificacao,
        data_emissao: elements.form.dataEmissao.value,
        data_validade: elements.form.dataValidade.value || null,
        entidade_emissora: elements.form.entidadeEmissora.value,
        numero_certificado: elements.form.numeroCertificado.value,
        concluida: elements.form.certificacaoConcluida.checked,
        observacoes: elements.form.observacoes.value
    };
      try {
        if (elements.form.id.value) {
            await atualizarCertificacao(elements.form.id.value, certificacaoData);
            mostrarAlerta('Certificação atualizada com sucesso!', 'success');
        } else {
            await criarCertificacao(certificacaoData);
            mostrarAlerta('Certificação criada com sucesso!', 'success');
        }
        
        resetForm();
        // Recarregar clientes para atualizar o status de certificação
        await carregarClientes();
        carregarHistorico();
        elements.tabs.clientes.click();
    } catch (error) {
        console.error('Erro ao salvar certificação:', error);
        mostrarAlerta('Erro ao salvar certificação. Por favor, tente novamente.', 'danger');
    }
}

async function criarCertificacao(certificacaoData) {
    return await fetchAPI('/certifications/', {
        method: 'POST',
        body: JSON.stringify(certificacaoData)
    });
}

async function atualizarCertificacao(id, certificacaoData) {
    return await fetchAPI(`/certifications/${id}`, {
        method: 'PUT',
        body: JSON.stringify(certificacaoData)
    });
}

async function excluirCertificacao(certificacaoId) {
    try {
        console.log('Iniciando exclusão da certificação:', certificacaoId);
        
        await fetchAPI(`/certifications/${certificacaoId}`, {
            method: 'DELETE'
        });
        
        console.log('Certificação excluída com sucesso!');
        mostrarAlerta('Certificação excluída com sucesso!', 'success');
        
        // Recarregar clientes para atualizar o status de certificação
        await carregarClientes();
        carregarHistorico();
    } catch (error) {
        console.error('Erro ao excluir certificação:', error);
        mostrarAlerta('Erro ao excluir certificação. Por favor, tente novamente.', 'danger');
    }
}

function confirmarExclusao(certificacaoId) {
    console.log('Confirmando exclusão da certificação:', certificacaoId);
    confirmarAcao('Tem certeza de que deseja excluir esta certificação?', () => {
        console.log('Usuário confirmou a exclusão');
        excluirCertificacao(certificacaoId);
    });
}

async function verificarCertificado(clienteId, descricao) {
    elements.modal.verificacao.loader.style.display = 'block';
    elements.modal.verificacao.resultado.style.display = 'none';
    elements.modal.verificacao.el.show();
    
    try {
        const resultado = await fetchAPI('/certifications/api/verifica-certificado', {
            method: 'POST',
            body: JSON.stringify({
                cliente_id: clienteId,
                descricao: descricao
            })
        });
        
        setTimeout(() => {
            elements.modal.verificacao.loader.style.display = 'none';
            elements.modal.verificacao.resultado.style.display = 'block';
            
            if (resultado.success) {
                elements.modal.verificacao.sucesso.style.display = 'block';
                elements.modal.verificacao.erro.style.display = 'none';
                elements.modal.verificacao.mensagem.textContent = resultado.message || 'Certificado verificado com sucesso!';
            } else {
                elements.modal.verificacao.sucesso.style.display = 'none';
                elements.modal.verificacao.erro.style.display = 'block';
                elements.modal.verificacao.erroMensagem.textContent = resultado.message || 'Falha na verificação do certificado.';
            }
        }, 2000); // Simular tempo de verificação
        
    } catch (error) {
        console.error('Erro ao verificar certificado:', error);
        
        setTimeout(() => {
            elements.modal.verificacao.loader.style.display = 'none';
            elements.modal.verificacao.resultado.style.display = 'block';
            elements.modal.verificacao.sucesso.style.display = 'none';
            elements.modal.verificacao.erro.style.display = 'block';
            elements.modal.verificacao.erroMensagem.textContent = 'Erro ao conectar com o serviço de verificação.';
        }, 2000);
    }
}

function resetForm() {
    elements.form.title.textContent = 'Nova Certificação';
    elements.form.el.reset();
    elements.form.id.value = '';
    elements.form.outroTipoContainer.style.display = 'none';
    elements.form.errorArea.style.display = 'none';
    
    // Definir data padrão como hoje
    const hoje = new Date().toISOString().split('T')[0];
    elements.form.dataEmissao.value = hoje;
    
    certificacaoAtual = null;
}

function confirmarAcao(mensagem, callback) {
    elements.modal.confirm.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.confirm.el.show();
}

// Função para debug específico do caso João da Silva
async function debugJoaoSilva() {
    console.group('DEBUG: Investigando caso João da Silva');
    
    try {
        // Buscar todos os clientes
        const clientes = await fetchAPI('/clientes/');
        console.log('Todos os clientes:', clientes);
        
        // Encontrar João da Silva
        const joao = clientes.find(cliente => 
            cliente.nome.toLowerCase().includes('joão') && 
            cliente.nome.toLowerCase().includes('silva')
        );
        
        if (!joao) {
            console.error('João da Silva não encontrado!');
            console.groupEnd();
            return;
        }
        
        console.log('João da Silva encontrado:', joao);
        
        // Buscar certificações específicas dele
        console.log(`Buscando certificações para cliente ID: ${joao.id}`);
        const certificacoes = await fetchAPI(`/certifications/${joao.id}`);
        console.log('Certificações do João:', certificacoes);
        
        // Calcular status step by step
        console.log('=== CALCULANDO STATUS ===');
        const status = calcularStatusCertificacao(certificacoes, joao.nome);
        console.log('Status final calculado:', status);
        
        // Verificar se o status foi aplicado corretamente
        console.log('Status atual no objeto cliente:', joao.certificacao_status);
        
    } catch (error) {
        console.error('Erro no debug:', error);
    }
    
    console.groupEnd();
}

// Função para testar a lógica de cálculo de status com dados simulados
function testarCalculoStatus() {
    console.group('TESTE: Lógica de cálculo de status');
    
    // Teste 1: Cliente sem certificações
    console.log('=== TESTE 1: Sem certificações ===');
    const resultado1 = calcularStatusCertificacao([], 'Cliente Teste 1');
    console.log('Resultado esperado: Pendente, Obtido:', resultado1);
    
    // Teste 2: Cliente com apenas certificações concluídas
    console.log('\n=== TESTE 2: Apenas concluídas ===');
    const certsConcluidas = [
        { id: 1, descricao: 'Treinamento A', concluida: true },
        { id: 2, descricao: 'Treinamento B', concluida: true }
    ];
    const resultado2 = calcularStatusCertificacao(certsConcluidas, 'Cliente Teste 2');
    console.log('Resultado esperado: Concluída, Obtido:', resultado2);
    
    // Teste 3: Cliente com certificações em andamento
    console.log('\n=== TESTE 3: Apenas em andamento ===');
    const certsAndamento = [
        { id: 3, descricao: 'Treinamento C', concluida: false },
        { id: 4, descricao: 'Treinamento D', concluida: false }
    ];
    const resultado3 = calcularStatusCertificacao(certsAndamento, 'Cliente Teste 3');
    console.log('Resultado esperado: Em Andamento, Obtido:', resultado3);
    
    // Teste 4: Cliente com mix de certificações
    console.log('\n=== TESTE 4: Mix de certificações ===');
    const certsMistas = [
        { id: 5, descricao: 'Treinamento E', concluida: true },
        { id: 6, descricao: 'Treinamento F', concluida: false }
    ];
    const resultado4 = calcularStatusCertificacao(certsMistas, 'Cliente Teste 4');
    console.log('Resultado esperado: Em Andamento, Obtido:', resultado4);
    
    // Teste 5: Testando com diferentes tipos de valores para concluida
    console.log('\n=== TESTE 5: Diferentes tipos de valores ===');
    const certsVariadas = [
        { id: 7, descricao: 'String true', concluida: 'true' },
        { id: 8, descricao: 'String false', concluida: 'false' },
        { id: 9, descricao: 'Number 1', concluida: 1 },
        { id: 10, descricao: 'Number 0', concluida: 0 },
        { id: 11, descricao: 'Boolean true', concluida: true },
        { id: 12, descricao: 'Boolean false', concluida: false }
    ];
    const resultado5 = calcularStatusCertificacao(certsVariadas, 'Cliente Teste 5');
    console.log('Resultado obtido:', resultado5);
    
    console.groupEnd();
}

// Função para simular e testar cenários problemáticos da API
function simularProblemasAPI() {
    console.group('SIMULAÇÃO: Problemas comuns da API');
    
    // Cenário 1: Valores como string ao invés de boolean
    console.log('\n=== CENÁRIO 1: Valores como string ===');
    const certString = [
        { id: 1, descricao: 'Teste String', concluida: 'true' },
        { id: 2, descricao: 'Teste String 2', concluida: 'false' }
    ];
    calcularStatusCertificacao(certString, 'Cliente String Test');
    
    // Cenário 2: Valores como números
    console.log('\n=== CENÁRIO 2: Valores como números ===');
    const certNumeros = [
        { id: 3, descricao: 'Teste Número', concluida: 1 },
        { id: 4, descricao: 'Teste Número 2', concluida: 0 }
    ];
    calcularStatusCertificacao(certNumeros, 'Cliente Número Test');
    
    // Cenário 3: Valores null/undefined
    console.log('\n=== CENÁRIO 3: Valores null/undefined ===');
    const certNull = [
        { id: 5, descricao: 'Teste Null', concluida: null },
        { id: 6, descricao: 'Teste Undefined', concluida: undefined }
    ];
    calcularStatusCertificacao(certNull, 'Cliente Null Test');
    
    // Cenário 4: Mix de tipos
    console.log('\n=== CENÁRIO 4: Mix de tipos ===');
    const certMix = [
        { id: 7, descricao: 'Boolean true', concluida: true },
        { id: 8, descricao: 'String false', concluida: 'false' },
        { id: 9, descricao: 'Number 1', concluida: 1 },
        { id: 10, descricao: 'String true', concluida: 'true' }
    ];
    calcularStatusCertificacao(certMix, 'Cliente Mix Test');
    
    // Cenário 5: Array vazio vs null vs undefined
    console.log('\n=== CENÁRIO 5: Arrays problemáticos ===');
    console.log('Array vazio:', calcularStatusCertificacao([], 'Cliente Array Vazio'));
    console.log('Null:', calcularStatusCertificacao(null, 'Cliente Null'));
    console.log('Undefined:', calcularStatusCertificacao(undefined, 'Cliente Undefined'));
    
    console.groupEnd();
}

// Adicionar ao window
window.simularProblemasAPI = simularProblemasAPI;

// Adicionar ao window
window.testarCalculoStatus = testarCalculoStatus;
window.debugJoaoSilva = debugJoaoSilva;
window.validarECorrigirDados = validarECorrigirDados;

// Função para verificar a integridade dos dados da API
async function verificarIntegridadeDados() {
    console.group('VERIFICAÇÃO: Integridade dos dados da API');
    
    try {
        // Buscar todos os clientes
        const clientes = await fetchAPI('/clientes/');
        console.log(`Total de clientes encontrados: ${clientes.length}`);
        
        // Verificar cada cliente
        for (let i = 0; i < Math.min(clientes.length, 5); i++) { // Limitar a 5 para não sobrecarregar
            const cliente = clientes[i];
            console.group(`Cliente ${i + 1}: ${cliente.nome}`);
            
            try {
                const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                console.log(`Certificações encontradas: ${certificacoes.length}`);
                
                if (certificacoes.length > 0) {
                    console.log('Estrutura das certificações:');
                    certificacoes.forEach((cert, index) => {
                        console.log(`  Cert ${index + 1}:`, {
                            id: cert.id,
                            tipo_id: typeof cert.id,
                            descricao: cert.descricao,
                            tipo_descricao: typeof cert.descricao,
                            concluida: cert.concluida,
                            tipo_concluida: typeof cert.concluida,
                            valor_raw: JSON.stringify(cert.concluida),
                            cliente_id: cert.cliente_id,
                            data_emissao: cert.data_emissao
                        });
                    });
                    
                    // Testar cálculo de status
                    const status = calcularStatusCertificacao(certificacoes, cliente.nome);
                    console.log(`Status calculado: ${status}`);
                } else {
                    console.log('Nenhuma certificação encontrada');
                }
                
            } catch (error) {
                console.error(`Erro ao buscar certificações para ${cliente.nome}:`, error);
            }
            
            console.groupEnd();
        }
        
        // Verificar se há padrões específicos
        console.log('\n=== ANÁLISE DE PADRÕES ===');
        const joaoSilva = clientes.find(c => 
            c.nome.toLowerCase().includes('joão') && 
            c.nome.toLowerCase().includes('silva')
        );
        
        if (joaoSilva) {
            console.log('João da Silva encontrado:', joaoSilva);
            const certJoao = await fetchAPI(`/certifications/${joaoSilva.id}`);
            console.log('Certificações do João (análise detalhada):');
            
            certJoao.forEach(cert => {
                console.log('Certificação:', cert);
                console.log('  concluida === true?', cert.concluida === true);
                console.log('  concluida === false?', cert.concluida === false);
                console.log('  concluida == true?', cert.concluida == true);
                console.log('  concluida == false?', cert.concluida == false);
                console.log('  Boolean(concluida):', Boolean(cert.concluida));
                console.log('  !concluida:', !cert.concluida);
            });
        }
        
    } catch (error) {
        console.error('Erro na verificação de integridade:', error);
    }
    
    console.groupEnd();
}

// Adicionar ao window
window.verificarIntegridadeDados = verificarIntegridadeDados;

// Função para aplicar correções automáticas nos dados
async function aplicarCorrecaoAutomatica() {
    console.group('CORREÇÃO AUTOMÁTICA: Tentando corrigir dados problemáticos');
    
    try {
        console.log('1. Buscando todos os clientes...');
        const clientes = await fetchAPI('/clientes/');
        
        let problemasEncontrados = 0;
        let corrigidasComSucesso = 0;
        
        for (const cliente of clientes.slice(0, 3)) { // Limitar para teste
            console.group(`Verificando cliente: ${cliente.nome}`);
            
            try {
                const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                
                if (certificacoes.length > 0) {
                    console.log('Certificações originais:', certificacoes);
                    
                    // Verificar se há problemas nos dados
                    let temProblemas = false;
                    certificacoes.forEach(cert => {
                        if (typeof cert.concluida === 'string' || 
                            cert.concluida === null || 
                            cert.concluida === undefined ||
                            typeof cert.concluida === 'number') {
                            temProblemas = true;
                        }
                    });
                    
                    if (temProblemas) {
                        problemasEncontrados++;
                        console.warn('Problemas encontrados nos dados deste cliente');
                        
                        // Calcular status com a função robusta
                        const statusCorrigido = calcularStatusCertificacao(certificacoes, cliente.nome);
                        
                        console.log(`Status calculado com correção: ${statusCorrigido}`);
                        
                        // Aplicar a correção localmente (na memória)
                        cliente.certificacao_status = statusCorrigido;
                        corrigidasComSucesso++;
                    } else {
                        console.log('Dados estão corretos para este cliente');
                        const status = calcularStatusCertificacao(certificacoes, cliente.nome);
                        cliente.certificacao_status = status;
                    }
                } else {
                    cliente.certificacao_status = 'Pendente';
                }
                
            } catch (error) {
                console.error(`Erro ao processar cliente ${cliente.nome}:`, error);
            }
            
            console.groupEnd();
        }
        
        console.log('\n=== RESUMO DA CORREÇÃO ===');
        console.log(`Problemas encontrados: ${problemasEncontrados}`);
        console.log(`Correções aplicadas: ${corrigidasComSucesso}`);
        
        // Recarregar a interface com os dados corrigidos
        if (corrigidasComSucesso > 0) {
            console.log('Atualizando interface com dados corrigidos...');
            await carregarClientes();
            mostrarAlerta(`Correções aplicadas! ${corrigidasComSucesso} cliente(s) corrigido(s).`, 'success');
        }
        
    } catch (error) {
        console.error('Erro na correção automática:', error);
        mostrarAlerta('Erro ao aplicar correções automáticas.', 'danger');
    }
    
    console.groupEnd();
}

// Adicionar ao window
window.aplicarCorrecaoAutomatica = aplicarCorrecaoAutomatica;

// Função para validar e corrigir dados de certificação em tempo real
async function validarECorrigirDados() {
    console.group('🔧 VALIDAÇÃO E CORREÇÃO DE DADOS');
    
    try {
        const clientes = await fetchAPI('/clientes/');
        console.log('Total de clientes carregados:', clientes.length);
        
        let problemaEncontrado = false;
        let clientesComProblema = [];
        
        for (let cliente of clientes) {
            try {
                const certificacoes = await fetchAPI(`/certifications/${cliente.id}`);
                
                if (certificacoes && certificacoes.length > 0) {
                    console.log(`\nAnalisando ${cliente.nome} (${certificacoes.length} certificações):`);
                    
                    let temProblema = false;
                    certificacoes.forEach((cert, index) => {
                        console.log(`  Cert ${index + 1}:`, {
                            id: cert.id,
                            descricao: cert.descricao,
                            concluida: cert.concluida,
                            tipo: typeof cert.concluida
                        });
                        
                        // Verificar se é um formato problemático
                        if (cert.concluida !== null && 
                            cert.concluida !== undefined && 
                            ![true, false, 'true', 'false', 1, 0, '1', '0', 'S', 's', 'N', 'n'].includes(cert.concluida)) {
                            console.warn(`    ⚠️ Formato inesperado: ${cert.concluida}`);
                            temProblema = true;
                            problemaEncontrado = true;
                        }
                    });
                    
                    if (temProblema) {
                        clientesComProblema.push(cliente.nome);
                    }
                    
                    // Calcular status com a nova função
                    const status = calcularStatusCertificacao(certificacoes, cliente.nome);
                    console.log(`  Status calculado: ${status}`);
                }
            } catch (error) {
                console.error(`Erro ao carregar certificações de ${cliente.nome}:`, error);
            }
        }
        
        console.log('\n📊 RESUMO DA VALIDAÇÃO:');
        console.log('Problemas encontrados:', problemaEncontrado);
        console.log('Clientes com formato problemático:', clientesComProblema);
        
        if (!problemaEncontrado) {
            console.log('✅ Todos os dados estão em formato reconhecido!');
            mostrarAlerta('Validação concluída: todos os dados estão corretos!', 'success');
        } else {
            console.log('❌ Encontrados problemas de formato nos dados');
            mostrarAlerta(`Problemas encontrados em: ${clientesComProblema.join(', ')}`, 'warning');
        }
        
    } catch (error) {
        console.error('Erro durante validação:', error);
        mostrarAlerta('Erro durante a validação dos dados', 'danger');
    }
    
    console.groupEnd();
}
