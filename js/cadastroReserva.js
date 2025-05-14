// Configuração da API
const API_URL = 'http://127.0.0.1:8000';

// Estado da aplicação
let currentReserva = null;
let bookings = [];
let clients = [];
let packages = [];
let acaoConfirmacao = null;

// Função para API
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
        
        if (response.status === 204) {
            return { success: true };
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro API:', error);
        mostrarAlerta(`Erro: ${error.message}`, 'danger');
        throw error;
    }
}

// Elementos do DOM
const elementos = {
    tabs: {
        lista: document.getElementById('lista-tab'),
        cadastro: document.getElementById('cadastro-tab'),
        detalhes: document.getElementById('detalhes-tab')
    },
    forms: {
        reserva: document.getElementById('formReserva'),
        clienteId: document.getElementById('clienteId'),
        packageId: document.getElementById('packageId'),
        valorOriginal: document.getElementById('valorOriginal'),
        valorImposto: document.getElementById('valorImposto'),
        valorTotal: document.getElementById('valorTotal')
    },
    buttons: {
        recarregar: document.getElementById('btnRecarregarLista'),
        cancelar: document.getElementById('btnCancelar'),
        editar: document.getElementById('btnEditar'),
        cancelarReserva: document.getElementById('btnExcluir')
    },
    containers: {
        listaReservas: document.getElementById('listaReservas'),
        listaLoader: document.getElementById('listaLoader'),
        detalhesLoader: document.getElementById('detalhesLoader'),
        detalhesReserva: document.getElementById('detalhesReserva')
    },
    detalhes: {
        cliente: document.getElementById('detalhesCliente'),
        pacote: document.getElementById('detalhesPacote'),
        valorOriginal: document.getElementById('detalhesValorOriginal'),
        valorImposto: document.getElementById('detalhesValorImposto'),
        valorTotal: document.getElementById('detalhesValorTotal'),
        status: document.getElementById('detalhesStatus')
    },    modal: {
        el: new bootstrap.Modal(document.getElementById('confirmModal')),
        message: document.getElementById('confirmMessage'),
        btnConfirm: document.getElementById('btnConfirmAction')
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    carregarDados();
    setupEventListeners();
});

function setupEventListeners() {
    elementos.buttons.recarregar.addEventListener('click', carregarReservas);
    elementos.buttons.cancelar.addEventListener('click', voltarParaLista);
    elementos.buttons.editar.addEventListener('click', editarReserva);
    elementos.buttons.cancelarReserva.addEventListener('click', cancelarReserva);
    elementos.forms.reserva.addEventListener('submit', salvarReserva);
    elementos.forms.packageId.addEventListener('change', atualizarValores);
    
    // Botão de confirmação no modal
    elementos.modal.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elementos.modal.el.hide();
        }
    });
}

// Funções de carregamento
async function carregarDados() {
    try {
        await Promise.all([
            carregarClientes(),
            carregarPacotes(),
            carregarReservas()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        alert('Erro ao carregar dados. Por favor, tente novamente.');
    }
}

async function carregarClientes() {
    clients = await fetchAPI('/clientes/');
    preencherSelectClientes();
}

async function carregarPacotes() {
    packages = await fetchAPI('/packages/');
    preencherSelectPacotes();
}

async function carregarReservas() {
    elementos.containers.listaLoader.style.display = 'block';
    elementos.containers.listaReservas.innerHTML = '';
    
    try {
        bookings = await fetchAPI('/bookings/');
        exibirReservas();
    } catch (error) {
        console.error('Erro ao carregar reservas:', error);
        alert('Erro ao carregar reservas. Por favor, tente novamente.');
    } finally {
        elementos.containers.listaLoader.style.display = 'none';
    }
}

// Funções de UI
function preencherSelectClientes() {
    const select = elementos.forms.clienteId;
    select.innerHTML = '<option value="">Selecione um cliente</option>';
    clients.forEach(client => {
        select.innerHTML += `<option value="${client.id}">${client.nome}</option>`;
    });
}

function preencherSelectPacotes() {
    const select = elementos.forms.packageId;
    select.innerHTML = '<option value="">Selecione um pacote</option>';
    packages.forEach(pkg => {
        select.innerHTML += `<option value="${pkg.id}">${pkg.nome} - ${formatarMoeda(pkg.preco)}</option>`;
    });
}

function exibirReservas() {
    elementos.containers.listaReservas.innerHTML = '';
    
    bookings.forEach(booking => {
        const client = clients.find(c => c.id === booking.cliente_id);
        const pkg = packages.find(p => p.id === booking.package_id);
        
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-4';
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${client ? client.nome : 'Cliente não encontrado'}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${pkg ? pkg.nome : 'Pacote não encontrado'}</h6>                    <p class="card-text">
                        <strong>Valor Total:</strong> ${formatarMoeda(booking.valor_total)}<br>
                        <strong>Status:</strong> <span class="badge bg-${getStatusColor(booking.status)}">${booking.status}</span>
                    </p><button class="btn btn-primary btn-sm" onclick="verDetalhes('${booking.id}')">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
        
        elementos.containers.listaReservas.appendChild(card);
    });
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

function atualizarValores() {
    const packageId = elementos.forms.packageId.value;
    const pkg = packages.find(p => p.id === parseInt(packageId));
    
    if (pkg) {
        elementos.forms.valorOriginal.value = pkg.preco;
        elementos.forms.valorImposto.value = pkg.preco * 0.1; // 10% de imposto
        elementos.forms.valorTotal.value = pkg.preco * 1.1;
    } else {
        elementos.forms.valorOriginal.value = '';
        elementos.forms.valorImposto.value = '';
        elementos.forms.valorTotal.value = '';
    }
}

// Funções de navegação
function voltarParaLista() {
    currentReserva = null;
    elementos.forms.reserva.reset();
    elementos.tabs.lista.click();
}

async function verDetalhes(id) {
    elementos.containers.detalhesLoader.style.display = 'block';
    elementos.containers.detalhesReserva.style.display = 'none';
    
    try {
        console.log(`Carregando detalhes da reserva com ID: ${id}`);
        currentReserva = await fetchAPI(`/bookings/${id}`);
        console.log('Dados da reserva carregados:', currentReserva);
        exibirDetalhesReserva();
        elementos.tabs.detalhes.click();
    } catch (error) {
        console.error('Erro ao carregar detalhes da reserva:', error);
        mostrarAlerta('Erro ao carregar detalhes da reserva. Por favor, tente novamente.', 'danger');
    } finally {
        elementos.containers.detalhesLoader.style.display = 'none';
        elementos.containers.detalhesReserva.style.display = 'block';
    }
}

function editarReserva() {
    if (!currentReserva) return;
    
    elementos.forms.clienteId.value = currentReserva.cliente_id;
    elementos.forms.packageId.value = currentReserva.package_id;
    
    // Ensure we update the values manually in case the package changed
    elementos.forms.valorOriginal.value = currentReserva.valor_original;
    elementos.forms.valorImposto.value = currentReserva.valor_imposto;
    elementos.forms.valorTotal.value = currentReserva.valor_total;
    
    elementos.tabs.cadastro.click();
}

// Funções de ação
async function salvarReserva(event) {
    event.preventDefault();
      const reservaData = {
        cliente_id: parseInt(elementos.forms.clienteId.value),
        package_id: parseInt(elementos.forms.packageId.value),
        valor_original: parseFloat(elementos.forms.valorOriginal.value),
        valor_imposto: parseFloat(elementos.forms.valorImposto.value),
        valor_total: parseFloat(elementos.forms.valorTotal.value),
        status: currentReserva ? currentReserva.status : 'Reservado'
    };
    
    if (currentReserva) {
        reservaData.id = currentReserva.id;
    }
    
    try {
        const endpoint = currentReserva ? `/bookings/${currentReserva.id}` : '/bookings/';
        const method = currentReserva ? 'PUT' : 'POST';
        
        await fetchAPI(endpoint, {
            method: method,
            body: JSON.stringify(reservaData)
        });
        
        await carregarReservas();
        voltarParaLista();
        mostrarAlerta('Reserva salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar reserva:', error);
        mostrarAlerta('Erro ao salvar reserva. Por favor, tente novamente.', 'danger');
    }
}

async function cancelarReserva() {
    if (!currentReserva) return;
    
    confirmarAcao('Tem certeza que deseja cancelar esta reserva?', async () => {
        try {
            await fetchAPI(`/bookings/${currentReserva.id}`, {
                method: 'DELETE'
            });
            
            await carregarReservas();
            voltarParaLista();
            mostrarAlerta('Reserva cancelada com sucesso!', 'success');
        } catch (error) {
            console.error('Erro ao cancelar reserva:', error);
            mostrarAlerta('Erro ao cancelar reserva. Por favor, tente novamente.', 'danger');        }
    });
}

// Funções auxiliares
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function getStatusColor(status) {
    const colors = {
        'Reservado': 'warning',
        'Pago': 'success',
        'Embarcado': 'success',
        'Cancelado': 'danger'
    };
    return colors[status] || 'secondary';
}

function confirmarAcao(mensagem, callback) {
    elementos.modal.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elementos.modal.el.show();
}

function exibirDetalhesReserva() {
    if (!currentReserva) return;
    
    // Use nested objects if available, otherwise find from list
    let clienteNome = 'Cliente não encontrado';
    let pacoteNome = 'Pacote não encontrado';
    
    if (currentReserva.cliente && currentReserva.cliente.nome) {
        clienteNome = currentReserva.cliente.nome;
    } else {
        const client = clients.find(c => c.id === currentReserva.cliente_id);
        if (client) clienteNome = client.nome;
    }
    
    if (currentReserva.pacote && currentReserva.pacote.nome) {
        pacoteNome = currentReserva.pacote.nome;
    } else {
        const pkg = packages.find(p => p.id === currentReserva.package_id);
        if (pkg) pacoteNome = pkg.nome;
    }
    
    elementos.detalhes.cliente.textContent = clienteNome;
    elementos.detalhes.pacote.textContent = pacoteNome;
    elementos.detalhes.valorOriginal.textContent = formatarMoeda(currentReserva.valor_original);
    elementos.detalhes.valorImposto.textContent = formatarMoeda(currentReserva.valor_imposto);
    elementos.detalhes.valorTotal.textContent = formatarMoeda(currentReserva.valor_total);
    elementos.detalhes.status.innerHTML = `<span class="badge bg-${getStatusColor(currentReserva.status)}">${currentReserva.status}</span>`;
    
    // Atualizar estado dos botões baseado no status
    elementos.buttons.cancelarReserva.disabled = currentReserva.status !== 'Reservado';
    elementos.buttons.editar.disabled = currentReserva.status === 'Cancelado';
}
