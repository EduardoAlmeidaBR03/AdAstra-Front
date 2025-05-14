// Configuração da API
const API_URL = 'http://127.0.0.1:8000';

// Elementos DOM
const elements = {
    tabs: {
        lista: document.getElementById('lista-tab'),
        cadastro: document.getElementById('cadastro-tab'),
        simulacao: document.getElementById('simulacao-tab')
    },
    loader: document.getElementById('impostoLoader'),
    lista: {
        container: document.getElementById('listaImpostos'),
        btnRecarregar: document.getElementById('btnRecarregarLista')
    },
    form: {
        el: document.getElementById('formImposto'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('impostoId'),
        paisOrigem: document.getElementById('paisOrigem'),
        paisDestino: document.getElementById('paisDestino'),
        percentual: document.getElementById('percentual'),
        descricao: document.getElementById('descricao'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },
    simulacao: {
        form: document.getElementById('formSimulacao'),
        paisOrigem: document.getElementById('simPaisOrigem'),
        paisDestino: document.getElementById('simPaisDestino'),
        valorBase: document.getElementById('valorBase'),
        resultado: document.getElementById('resultadoSimulacao'),
        resultOrigem: document.getElementById('resultOrigem'),
        resultDestino: document.getElementById('resultDestino'),
        resultPercentual: document.getElementById('resultPercentual'),
        resultValorBase: document.getElementById('resultValorBase'),
        resultValorImposto: document.getElementById('resultValorImposto'),
        resultValorTotal: document.getElementById('resultValorTotal'),
        btnNovaSimulacao: document.getElementById('btnNovaSimulacao')
    },
    modal: {
        el: new bootstrap.Modal(document.getElementById('confirmModal')),
        message: document.getElementById('confirmMessage'),
        btnConfirm: document.getElementById('btnConfirmAction')
    }
};

// Variáveis de estado
let impostoAtual = null;
let acaoConfirmacao = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    // Carregar lista de impostos
    carregarImpostos();
    
    // Configurar eventos
    setupEventListeners();
    
    console.log('AdAstra - Sistema de Gestão de Impostos inicializado');
});

// Configuração de todos os event listeners
function setupEventListeners() {
    // Botão recarregar lista
    elements.lista.btnRecarregar.addEventListener('click', carregarImpostos);
    
    // Form de cadastro/edição
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    
    // Adicionar validação em tempo real
    elements.form.paisOrigem.addEventListener('blur', validateField);
    elements.form.paisDestino.addEventListener('blur', validateField);
    elements.form.percentual.addEventListener('blur', validateField);
    
    // Form de simulação
    elements.simulacao.form.addEventListener('submit', handleSimulacao);
    elements.simulacao.btnNovaSimulacao.addEventListener('click', resetSimulacao);
    
    // Confirmação de ação
    elements.modal.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.el.hide();
        }
    });
}

// Funções para manipular a UI
function exibirLoader(show = true) {
    elements.loader.style.display = show ? 'inline-block' : 'none';
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

// Funções principais de CRUD
async function carregarImpostos() {
    try {
        exibirLoader(true);
        elements.lista.container.innerHTML = '';
        
        const impostos = await fetchAPI('/taxes/');
        
        if (impostos.length === 0) {
            elements.lista.container.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">
                        <div class="alert alert-info m-0">
                            Nenhuma regra fiscal cadastrada. Clique em "Cadastrar Regra Fiscal" para adicionar.
                        </div>
                    </td>
                </tr>
            `;
        } else {
            renderizarListaImpostos(impostos);
        }
    } catch (error) {
        console.error('Erro ao carregar impostos:', error);
        elements.lista.container.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">
                    <div class="alert alert-danger m-0">
                        Erro ao carregar impostos: ${error.message}
                    </div>
                </td>
            </tr>
        `;
    } finally {
        exibirLoader(false);
    }
}

function renderizarListaImpostos(impostos) {
    elements.lista.container.innerHTML = '';
    
    impostos.forEach(imposto => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${imposto.pais_origem}</td>
            <td>${imposto.pais_destino}</td>
            <td>${imposto.percentual}%</td>
            <td>${imposto.descricao || '-'}</td>
            <td>
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-outline-primary btn-editar" title="Editar" data-id="${imposto.id}">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-excluir" title="Excluir" data-id="${imposto.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        elements.lista.container.appendChild(tr);
        
        // Adicionar event listeners aos botões
        const btnEditar = tr.querySelector('.btn-editar');
        btnEditar.addEventListener('click', () => prepararEdicao(imposto));
        
        const btnExcluir = tr.querySelector('.btn-excluir');
        btnExcluir.addEventListener('click', () => {
            confirmarAcao(`Tem certeza que deseja excluir a regra fiscal para ${imposto.pais_origem} → ${imposto.pais_destino}?`, 
                () => excluirImposto(imposto.id));
        });
    });
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Impedir envio duplo desabilitando o botão
    elements.form.btnSalvar.disabled = true;
    
    try {
        const isEdicao = elements.form.id.value !== '';
        
        // Validar campos obrigatórios
        let isFormValid = true;
        const camposObrigatorios = [
            elements.form.paisOrigem,
            elements.form.paisDestino,
            elements.form.percentual
        ];
        
        camposObrigatorios.forEach(campo => {
            const event = { target: campo };
            if (!validateField(event)) {
                isFormValid = false;
            }
        });
        
        if (!isFormValid) {
            throw new Error('Por favor, corrija os erros no formulário');
        }
        
        const formData = {
            pais_origem: elements.form.paisOrigem.value.trim(),
            pais_destino: elements.form.paisDestino.value.trim(),
            percentual: parseFloat(elements.form.percentual.value),
            descricao: elements.form.descricao.value.trim() || null
        };
        
        if (isEdicao) {
            // Atualizar regra fiscal existente
            await fetchAPI(`/taxes/${elements.form.id.value}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Regra fiscal atualizada com sucesso!');
        } else {
            // Criar nova regra fiscal
            await fetchAPI('/taxes/', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            mostrarAlerta('Regra fiscal cadastrada com sucesso!');
        }
        
        // Resetar formulário e voltar para lista
        resetForm();
        await carregarImpostos();
        elements.tabs.lista.click();
    } catch (error) {
        console.error('Erro ao salvar regra fiscal:', error);
        mostrarAlerta(`Erro ao salvar regra fiscal: ${error.message}`, 'danger');
    } finally {
        // Re-habilitar o botão após o processamento
        elements.form.btnSalvar.disabled = false;
    }
}

async function excluirImposto(impostoId) {
    try {
        await fetchAPI(`/taxes/${impostoId}`, {
            method: 'DELETE'
        });
        
        mostrarAlerta('Regra fiscal excluída com sucesso!');
        
        // Recarregar lista
        await carregarImpostos();
    } catch (error) {
        console.error('Erro ao excluir regra fiscal:', error);
        mostrarAlerta(`Erro ao excluir regra fiscal: ${error.message}`, 'danger');
    }
}

async function handleSimulacao(event) {
    event.preventDefault();
    
    try {
        const paisOrigem = elements.simulacao.paisOrigem.value.trim();
        const paisDestino = elements.simulacao.paisDestino.value.trim();
        const valorBase = parseFloat(elements.simulacao.valorBase.value);
        
        if (!paisOrigem || !paisDestino || isNaN(valorBase) || valorBase <= 0) {
            throw new Error('Preencha todos os campos corretamente');
        }
        
        exibirLoader(true);
        
        // Chamar API para simular o cálculo de imposto
        const resultado = await fetchAPI(`/taxes/api/imposto?pais_origem=${encodeURIComponent(paisOrigem)}&pais_destino=${encodeURIComponent(paisDestino)}&valor=${valorBase}`, {
            method: 'POST'
        });
        
        if (resultado.success) {
            // Preencher resultados
            elements.simulacao.resultOrigem.textContent = resultado.origem;
            elements.simulacao.resultDestino.textContent = resultado.destino;
            elements.simulacao.resultPercentual.textContent = resultado.percentual;
            elements.simulacao.resultValorBase.textContent = resultado.valor_base.toFixed(2);
            elements.simulacao.resultValorImposto.textContent = resultado.valor_imposto.toFixed(2);
            elements.simulacao.resultValorTotal.textContent = resultado.valor_total.toFixed(2);
            
            // Mostrar resultados
            elements.simulacao.resultado.style.display = 'block';
            
            // Desativar o formulário
            elements.simulacao.form.classList.add('d-none');
        } else {
            throw new Error(resultado.message || 'Erro ao simular cálculo de imposto');
        }
    } catch (error) {
        console.error('Erro na simulação:', error);
        mostrarAlerta(`Erro na simulação: ${error.message}`, 'danger');
    } finally {
        exibirLoader(false);
    }
}

function resetSimulacao() {
    // Limpar formulário
    elements.simulacao.form.reset();
    
    // Esconder resultado e mostrar formulário
    elements.simulacao.resultado.style.display = 'none';
    elements.simulacao.form.classList.remove('d-none');
}

function prepararEdicao(imposto) {
    // Configurar modo de edição
    elements.form.title.textContent = 'Editar Regra Fiscal';
    elements.form.id.value = imposto.id;
    
    // Preencher campos
    elements.form.paisOrigem.value = imposto.pais_origem;
    elements.form.paisDestino.value = imposto.pais_destino;
    elements.form.percentual.value = imposto.percentual;
    elements.form.descricao.value = imposto.descricao || '';
    
    // Mudar para aba de cadastro
    elements.tabs.cadastro.click();
}

function resetForm() {
    // Resetar formulário
    elements.form.el.reset();
    elements.form.id.value = '';
    
    // Voltar para modo de criação
    elements.form.title.textContent = 'Cadastrar Nova Regra Fiscal';
    
    // Remover classes de validação
    elements.form.paisOrigem.classList.remove('is-invalid', 'is-valid');
    elements.form.paisDestino.classList.remove('is-invalid', 'is-valid');
    elements.form.percentual.classList.remove('is-invalid', 'is-valid');
    
    // Esconder mensagens de erro
    const formErrorArea = document.getElementById('formErrorArea');
    if (formErrorArea) {
        formErrorArea.style.display = 'none';
    }
}

function confirmarAcao(mensagem, callback) {
    elements.modal.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.el.show();
}

// Validação de campos
function validateField(event) {
    const campo = event.target;
    const valor = campo.value.trim();
    
    // Reset estado anterior
    campo.classList.remove('is-invalid', 'is-valid');
    
    // Validação específica para cada campo
    switch (campo.id) {
        case 'paisOrigem':
        case 'paisDestino':
            if (!valor) {
                campo.classList.add('is-invalid');
                return false;
            }
            campo.classList.add('is-valid');
            return true;
        
        case 'percentual':
            if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) < 0 || parseFloat(valor) > 100) {
                campo.classList.add('is-invalid');
                return false;
            }
            campo.classList.add('is-valid');
            return true;
            
        default:
            return true;
    }
}
