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
        documentoIdentidade: document.getElementById('documentoIdentidade'),
        telefone: document.getElementById('telefone'),
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
        documento: document.getElementById('detalhesDocumento'),
        telefone: document.getElementById('detalhesTelefone'),
        pais: document.getElementById('detalhesPais'),
        endereco: document.getElementById('detalhesEndereco'),
        btnEditar: document.getElementById('btnEditar'),
        btnExcluir: document.getElementById('btnExcluir')
    },
    modal: {
        deleteModal: new bootstrap.Modal(document.getElementById('deleteModal')),
        deleteClienteName: document.getElementById('deleteClienteName'),
        btnConfirmDelete: document.getElementById('btnConfirmDelete')
    }
};

// Cliente atual
let clienteAtual = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar lista de clientes
    carregarClientes();
    
    // Configurar eventos
    setupEventListeners();
});

// Configuração de todos os event listeners
function setupEventListeners() {
    // Botão recarregar lista
    elements.lista.btnRecarregar.addEventListener('click', carregarClientes);
    
    // Form de cadastro/edição
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    
    // Botões de ações na tela de detalhes
    elements.detalhes.btnEditar.addEventListener('click', () => {
        if (clienteAtual) {
            preencherFormulario(clienteAtual);
            elements.tabs.cadastro.click();
        }
    });
    
    elements.detalhes.btnExcluir.addEventListener('click', () => {
        if (clienteAtual) {
            elements.modal.deleteClienteName.textContent = clienteAtual.nome;
            elements.modal.deleteModal.show();
        }
    });
    
    // Confirmação de exclusão
    elements.modal.btnConfirmDelete.addEventListener('click', () => {
        if (clienteAtual) {
            excluirCliente(clienteAtual.id);
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
    
    // Auto-remover após a duração
    setTimeout(() => {
        alertEl.classList.remove('show');
        setTimeout(() => alertEl.remove(), 300);
    }, duracao);
}

// Funções para comunicação com a API
async function fetchAPI(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        // Para DELETE retornamos apenas o status
        if (options.method === 'DELETE') {
            return { success: response.ok };
        }
        
        // Para outros métodos, retornamos os dados JSON
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Erro na comunicação com a API');
        }
        
        // Para requisições que não retornam dados (204 No Content)
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
    elements.lista.container.innerHTML = '';
    
    clientes.forEach(cliente => {
        const clienteCard = document.createElement('div');
        clienteCard.className = 'col-md-4';
        
        const dataNascimento = new Date(cliente.data_nascimento).toLocaleDateString('pt-BR');
        
        clienteCard.innerHTML = `
            <div class="card cliente-card">
                <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">${cliente.nome}</h5>
                </div>
                <div class="card-body">
                    <p><i class="bi bi-envelope"></i> ${cliente.email}</p>
                    <p><i class="bi bi-telephone"></i> ${cliente.telefone}</p>
                    <p><i class="bi bi-geo-alt"></i> ${cliente.pais}</p>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-end">
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
            clienteAtual = cliente;
            elements.modal.deleteClienteName.textContent = cliente.nome;
            elements.modal.deleteModal.show();
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
        elements.detalhes.dataNascimento.textContent = dataNascimento;
        elements.detalhes.documento.textContent = cliente.documento_identidade;
        elements.detalhes.telefone.textContent = cliente.telefone;
        elements.detalhes.pais.textContent = cliente.pais;
        elements.detalhes.endereco.textContent = cliente.endereco;
        
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
    
    const isEdicao = elements.form.id.value !== '';
    const formData = {
        nome: elements.form.nome.value,
        email: elements.form.email.value,
        data_nascimento: elements.form.dataNascimento.value,
        documento_identidade: elements.form.documentoIdentidade.value,
        telefone: elements.form.telefone.value,
        pais: elements.form.pais.value,
        endereco: elements.form.endereco.value
    };
    
    // Adicionar senha apenas para criação, não para edição
    if (!isEdicao && elements.form.senha.value) {
        formData.senha = elements.form.senha.value;
    }
    
    try {
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
    }
}

async function excluirCliente(clienteId) {
    try {
        await fetchAPI(`/clientes/${clienteId}`, {
            method: 'DELETE'
        });
        
        mostrarAlerta('Cliente excluído com sucesso!');
        elements.modal.deleteModal.hide();
        
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
    elements.form.dataNascimento.value = cliente.data_nascimento;
    elements.form.documentoIdentidade.value = cliente.documento_identidade;
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