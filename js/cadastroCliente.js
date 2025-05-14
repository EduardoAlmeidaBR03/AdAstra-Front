// Configuração da API
const API_URL = 'http://127.0.0.1:8000';

// Elementos DOM
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
        container: document.getElementById('listaClientes'),
        btnRecarregar: document.getElementById('btnRecarregarLista')
    },
    form: {
        el: document.getElementById('formCliente'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('clienteId'),
        nome: document.getElementById('nome'),
        email: document.getElementById('email'),
        senha: document.getElementById('senha'),
        senhaLabel: document.getElementById('senhaLabel'),
        dataNascimento: document.getElementById('dataNascimento'),
        documentoIdentidade: document.getElementById('documentoIdentidade'),        telefone: document.getElementById('telefone'),
        pais: document.getElementById('pais'),
        endereco: document.getElementById('endereco'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },
    detalhes: {
        container: document.getElementById('detalhesCliente'),
        nome: document.getElementById('detalhesNome'),
        email: document.getElementById('detalhesEmail'),
        dataNascimento: document.getElementById('detalhesDataNascimento'),
        documento: document.getElementById('detalhesDocumento'),        telefone: document.getElementById('detalhesTelefone'),        pais: document.getElementById('detalhesPais'),
        endereco: document.getElementById('detalhesEndereco'),
        statusMedico: document.getElementById('detalhesStatusMedico'),
        certificacaoStatus: document.getElementById('detalhesCertificacaoStatus'),
        btnEditar: document.getElementById('btnEditar'),
        btnExcluir: document.getElementById('btnExcluir')
    },
    modal: {
        el: new bootstrap.Modal(document.getElementById('confirmModal')),
        message: document.getElementById('confirmMessage'),
        btnConfirm: document.getElementById('btnConfirmAction')
    }
};

// Cliente atual
let clienteAtual = null;
let acaoConfirmacao = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar lista de clientes
    carregarClientes();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('AdAstra - Sistema de Gestão de Clientes inicializado');
});

// Configuração de todos os event listeners
function setupEventListeners() {
    // Botão recarregar lista
    elements.lista.btnRecarregar.addEventListener('click', carregarClientes);
    
    // Form de cadastro/edição
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    
    // Adicionar validação em tempo real
    elements.form.nome.addEventListener('blur', validateField);
    elements.form.email.addEventListener('blur', validateField);
    elements.form.senha.addEventListener('blur', validateField);
    elements.form.documentoIdentidade.addEventListener('blur', validateField);
    elements.form.telefone.addEventListener('blur', validateField);
    
    // Botões de ações na tela de detalhes
    elements.detalhes.btnEditar.addEventListener('click', () => {
        if (clienteAtual) {
            preencherFormulario(clienteAtual);
            elements.tabs.cadastro.click();
        }
    });
    
    elements.detalhes.btnExcluir.addEventListener('click', () => {
        if (clienteAtual) {
            confirmarAcao(`Tem certeza que deseja excluir o cliente ${clienteAtual.nome}?`, 
                () => excluirCliente(clienteAtual.id));
        }
    });
    
    // Confirmação de ação
    elements.modal.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.el.hide();
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
        return data;    } catch (error) {
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

// Funções principais de CRUD
async function carregarClientes() {
    try {
        exibirLoader(elements.loaders.lista, true);
        elements.lista.container.innerHTML = '';
        
        const clientes = await fetchAPI('/clientes/');
        
        if (clientes.length === 0) {
            elements.lista.container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Nenhum cliente cadastrado. Clique em "Cadastrar Cliente" para adicionar.
                    </div>
                </div>
            `;
        } else {
            renderizarListaClientes(clientes);
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    } finally {
        exibirLoader(elements.loaders.lista, false);
    }
}

function renderizarListaClientes(clientes) {
    elements.lista.container.innerHTML = '';    clientes.forEach(cliente => {
        const clienteCard = document.createElement('div');
        clienteCard.className = 'col-md-4 mb-4';
        
        const dataNascimento = new Date(cliente.data_nascimento).toLocaleDateString('pt-BR');
        
        // Status médico e certificação para badges na lista
        const statusMedicoHTML = formatarStatusMedico(cliente.status_medico);
        const certificacaoStatusHTML = formatarCertificacaoStatus(cliente.certificacao_status);
        
        clienteCard.innerHTML = `
            <div class="card cliente-card h-100 shadow-sm">
                <div class="card-header bg-primary text-white d-flex align-items-center">
                    <i class="bi bi-person-circle me-2"></i>
                    <h5 class="card-title mb-0">${cliente.nome}</h5>
                </div>
                <div class="card-body">
                    <p class="mb-2"><i class="bi bi-envelope text-muted me-2"></i> ${cliente.email}</p>                    <p class="mb-2"><i class="bi bi-calendar text-muted me-2"></i> ${dataNascimento}</p>
                    <p class="mb-2"><i class="bi bi-telephone text-muted me-2"></i> ${cliente.telefone}</p>
                    <p class="mb-2"><i class="bi bi-geo-alt text-muted me-2"></i> ${cliente.pais}</p>
                    <p class="mb-2"><i class="bi bi-heart-pulse text-muted me-2"></i> Status Médico: ${statusMedicoHTML}</p>
                    <p class="mb-0"><i class="bi bi-award text-muted me-2"></i> Certificação: ${certificacaoStatusHTML}</p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-primary btn-action btn-visualizar" data-id="${cliente.id}">
                            <i class="bi bi-eye"></i> Visualizar
                        </button>
                        <button class="btn btn-sm btn-outline-danger btn-action btn-remover" data-id="${cliente.id}">
                            <i class="bi bi-trash"></i> Remover
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        elements.lista.container.appendChild(clienteCard);
        
        // Adicionar event listeners aos botões
        const btnVisualizar = clienteCard.querySelector('.btn-visualizar');
        btnVisualizar.addEventListener('click', () => carregarDetalhesCliente(cliente.id));
        
        const btnRemover = clienteCard.querySelector('.btn-remover');
        btnRemover.addEventListener('click', () => {
            confirmarAcao(`Tem certeza que deseja excluir o cliente ${cliente.nome}?`, 
                () => excluirCliente(cliente.id));
        });
    });
}

async function carregarDetalhesCliente(clienteId) {
    try {
        exibirLoader(elements.loaders.detalhes, true);
        elements.detalhes.container.style.display = 'none';
        
        const cliente = await fetchAPI(`/clientes/${clienteId}`);
        clienteAtual = cliente;
        
        // Formatar data
        const dataNascimento = new Date(cliente.data_nascimento).toLocaleDateString('pt-BR');
        
        // Preencher detalhes
        elements.detalhes.nome.textContent = cliente.nome;
        elements.detalhes.email.textContent = cliente.email;
        elements.detalhes.dataNascimento.textContent = dataNascimento;        elements.detalhes.documento.textContent = cliente.documento_identidade;
        elements.detalhes.telefone.textContent = cliente.telefone;
        elements.detalhes.pais.textContent = cliente.pais;
        elements.detalhes.endereco.textContent = cliente.endereco;
        elements.detalhes.statusMedico.innerHTML = formatarStatusMedico(cliente.status_medico);
        elements.detalhes.certificacaoStatus.innerHTML = formatarCertificacaoStatus(cliente.certificacao_status);
        
        // Mostrar aba de detalhes
        elements.tabs.detalhes.click();
        elements.detalhes.container.style.display = 'block';
    } catch (error) {
        console.error('Erro ao carregar detalhes do cliente:', error);
    } finally {
        exibirLoader(elements.loaders.detalhes, false);
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Impedir envio duplo desabilitando o botão
    elements.form.btnSalvar.disabled = true;
    
    try {
        const isEdicao = elements.form.id.value !== '';
        
        // Validar todos os campos obrigatórios
        let isFormValid = true;
        
        // Lista de campos a validar
        const fieldsToValidate = [
            elements.form.nome,
            elements.form.email,
            elements.form.documentoIdentidade,
            elements.form.telefone
        ];
        
        // Adicionar senha à validação apenas para criação
        if (!isEdicao) {
            fieldsToValidate.push(elements.form.senha);
        }
        
        // Validar cada campo
        fieldsToValidate.forEach(field => {
            const event = { target: field };
            if (!validateField(event)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            throw new Error('Por favor, corrija os erros no formulário');
        }
          const formData = {
            nome: elements.form.nome.value.trim(),
            email: elements.form.email.value.trim(),
            data_nascimento: elements.form.dataNascimento.value,
            documento_identidade: elements.form.documentoIdentidade.value.trim(),
            telefone: elements.form.telefone.value.trim(),
            pais: elements.form.pais.value.trim(),
            endereco: elements.form.endereco.value.trim()
        };
        
        // Adicionar senha apenas para criação, não para edição
        if (!isEdicao) {
            formData.senha = elements.form.senha.value;
            console.log('Dados do formulário de novo cliente:', formData);
        } else {
            console.log('Dados do formulário de edição:', formData);
        }
        
        if (isEdicao) {
            // Atualizar cliente existente
            await fetchAPI(`/clientes/${elements.form.id.value}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Cliente atualizado com sucesso!');
        } else {
            // Criar novo cliente
            await fetchAPI('/clientes/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Cliente cadastrado com sucesso!');
        }
        
        // Resetar formulário e voltar para lista
        resetForm();
        await carregarClientes();
        elements.tabs.lista.click();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        mostrarAlerta(`Erro ao salvar cliente: ${error.message}`, 'danger');
    } finally {
        // Re-habilitar o botão após o processamento
        elements.form.btnSalvar.disabled = false;
    }
}

async function excluirCliente(clienteId) {
    try {
        await fetchAPI(`/clientes/${clienteId}`, {
            method: 'DELETE'
        });
        
        mostrarAlerta('Cliente excluído com sucesso!');
        
        // Voltar para a lista e recarregar
        elements.tabs.lista.click();
        await carregarClientes();
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
    }
}

function preencherFormulario(cliente) {
    // Configurar modo de edição
    elements.form.title.textContent = 'Editar Cliente';
    elements.form.id.value = cliente.id;
    
    // Preencher campos
    elements.form.nome.value = cliente.nome;
    elements.form.email.value = cliente.email;
    elements.form.dataNascimento.value = cliente.data_nascimento.split('T')[0]; // Apenas a data    elements.form.documentoIdentidade.value = cliente.documento_identidade;
    elements.form.telefone.value = cliente.telefone;
    elements.form.pais.value = cliente.pais;
    elements.form.endereco.value = cliente.endereco;
    
    // Manipular campo senha (opcional na edição)
    elements.form.senha.value = '';
    elements.form.senha.required = false;
    elements.form.senhaLabel.classList.remove('required-field');
}

function resetForm() {
    // Resetar formulário
    elements.form.el.reset();
    elements.form.id.value = '';
    
    // Voltar para modo de criação
    elements.form.title.textContent = 'Cadastrar Novo Cliente';
    
    // Resetar campo senha (obrigatório na criação)
    elements.form.senha.required = true;
    elements.form.senhaLabel.classList.add('required-field');
    
    // Voltar para lista se cancelou
    elements.tabs.lista.click();
}

function confirmarAcao(mensagem, callback) {
    elements.modal.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.el.show();
}

// Funções auxiliares para formatar status
function formatarStatusMedico(status) {
    const mapStatus = {
        'Aprovado': '<span class="badge bg-success">Aprovado</span>',
        'Pendente': '<span class="badge bg-warning text-dark">Pendente</span>',
        'Reprovado': '<span class="badge bg-danger">Reprovado</span>'
    };
    return mapStatus[status] || `<span class="badge bg-secondary">Não Informado</span>`;
}

function formatarCertificacaoStatus(status) {
    const mapStatus = {
        'Concluída': '<span class="badge bg-success">Concluída</span>',
        'Pendente': '<span class="badge bg-warning text-dark">Pendente</span>'
    };
    return mapStatus[status] || `<span class="badge bg-secondary">Não Informado</span>`;
}

// Função para validação em tempo real
function validateField(event) {
    const field = event.target;
    const fieldName = field.id;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Remover classes e mensagens de erro anteriores
    field.classList.remove('is-invalid');
    const feedbackElement = field.nextElementSibling?.classList.contains('invalid-feedback') 
        ? field.nextElementSibling 
        : null;
    
    if (feedbackElement) {
        feedbackElement.remove();
    }
    
    // Validação específica para cada campo
    switch (fieldName) {
        case 'nome':
            if (!value) {
                isValid = false;
                errorMessage = 'Nome é obrigatório';
            }
            break;
            
        case 'email':
            if (!value) {
                isValid = false;
                errorMessage = 'E-mail é obrigatório';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                isValid = false;
                errorMessage = 'E-mail inválido';
            }
            break;
            
        case 'senha':
            // Validar senha apenas se estiver no modo de criação
            if (!elements.form.id.value && !value) {
                isValid = false;
                errorMessage = 'Senha é obrigatória para novos clientes';
            } else if (value && value.length < 6) {
                isValid = false;
                errorMessage = 'A senha deve ter pelo menos 6 caracteres';
            }
            break;
            
        case 'documentoIdentidade':
            if (!value) {
                isValid = false;
                errorMessage = 'Documento de identidade é obrigatório';
            }
            break;
            
        case 'telefone':
            if (!value) {
                isValid = false;
                errorMessage = 'Telefone é obrigatório';
            }
            break;
    }
    
    // Se o campo for inválido, mostrar erro
    if (!isValid) {
        field.classList.add('is-invalid');
        
        // Criar elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        feedback.textContent = errorMessage;
        
        // Inserir após o campo
        field.parentNode.insertBefore(feedback, field.nextSibling);
    }
    
    return isValid;
}