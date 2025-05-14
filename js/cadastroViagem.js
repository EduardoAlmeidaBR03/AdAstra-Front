const API_URL = 'http://127.0.0.1:8000';

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
        container: document.getElementById('listaViagens'),
        btnRecarregar: document.getElementById('btnRecarregarLista')
    },
    form: {
        el: document.getElementById('formViagem'),
        title: document.getElementById('formTitle'),
        id: document.getElementById('viagemId'),
        pacoteId: document.getElementById('pacoteId'),
        dataPartida: document.getElementById('dataPartida'),
        duracaoHoras: document.getElementById('duracaoHoras'),
        capacidade: document.getElementById('capacidade'),
        descricao: document.getElementById('descricao'),
        btnCancelar: document.getElementById('btnCancelar'),
        btnSalvar: document.getElementById('btnSalvar')
    },    detalhes: {
        container: document.getElementById('detalhesViagem'),
        descricao: document.getElementById('detalhesDescricao'),
        pacote: document.getElementById('detalhesPacote'),
        dataPartida: document.getElementById('detalhesDataPartida'),
        duracao: document.getElementById('detalhesDuracao'),
        capacidade: document.getElementById('detalhesCapacidade'),
        status: document.getElementById('detalhesStatus')
    },
    modal: {
        el: new bootstrap.Modal(document.getElementById('confirmModal')),
        message: document.getElementById('confirmMessage'),
        btnConfirm: document.getElementById('btnConfirmAction')
    }
};

let viagemAtual = null;
let acaoConfirmacao = null;

document.addEventListener('DOMContentLoaded', () => {
    carregarViagens();
    setupEventListeners();
});

function setupEventListeners() {
    elements.lista.btnRecarregar.addEventListener('click', carregarViagens);
    elements.form.el.addEventListener('submit', handleFormSubmit);
    elements.form.btnCancelar.addEventListener('click', resetForm);
    
    elements.modal.btnConfirm.addEventListener('click', () => {
        if (acaoConfirmacao) {
            acaoConfirmacao();
            elements.modal.el.hide();
        }
    });
}

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

async function carregarViagens() {
    try {
        exibirLoader(elements.loaders.lista, true);
        const viagens = await fetchAPI('/trips');
        renderizarListaViagens(viagens);
    } catch (error) {
        console.error('Erro ao carregar viagens:', error);
    } finally {
        exibirLoader(elements.loaders.lista, false);
    }
}

function renderizarListaViagens(viagens) {
    elements.lista.container.innerHTML = '';
      viagens.forEach(viagem => {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4 mb-4';
        // Extrair as 4 primeiras palavras para o título
        const palavras = viagem.descricao.split(' ');
        const titulo = palavras.slice(0, 4).join(' ') + (palavras.length > 4 ? '...' : '');
        
        card.innerHTML = `
            <div class="card h-100">
                <div class="card-body">
                    <h5 class="card-title">${titulo}</h5>
                    <p class="card-text text-muted mb-3" style="font-size: 0.9em;">${viagem.descricao}</p>
                    <p class="card-text">
                        <strong>Data de Partida:</strong> ${new Date(viagem.data_partida).toLocaleString()}<br>
                        <strong>Duração:</strong> ${viagem.duracao_horas}h<br>
                        <strong>Status:</strong> ${viagem.status}
                    </p>
                    <button class="btn btn-primary btn-sm" onclick="carregarDetalhesViagem('${viagem.id}')">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        `;
        
        elements.lista.container.appendChild(card);
    });
}

async function carregarDetalhesViagem(id) {
    try {
        exibirLoader(elements.loaders.detalhes, true);
        const viagem = await fetchAPI(`/trips/${id}`);
        viagemAtual = viagem;
        renderizarDetalhesViagem(viagem);
        elements.tabs.detalhes.click();
    } catch (error) {
        console.error('Erro ao carregar detalhes da viagem:', error);
    } finally {
        exibirLoader(elements.loaders.detalhes, false);
    }
}

function renderizarDetalhesViagem(viagem) {
    // Extrair as 4 primeiras palavras para o título
    const palavras = viagem.descricao.split(' ');
    const titulo = palavras.slice(0, 4).join(' ') + (palavras.length > 4 ? '...' : '');
    
    // Atualizar título e descrição separadamente
    elements.detalhes.descricao.innerHTML = `
        <h4 class="mb-3">${titulo}</h4>
        <p class="text-muted">${viagem.descricao}</p>
    `;
    
    elements.detalhes.pacote.textContent = viagem.pacote_id;
    elements.detalhes.dataPartida.textContent = new Date(viagem.data_partida).toLocaleString();
    elements.detalhes.duracao.textContent = `${viagem.duracao_horas} horas`;
    elements.detalhes.capacidade.textContent = viagem.capacidade;
    elements.detalhes.status.textContent = viagem.status;
}

async function handleFormSubmit(event) {
    event.preventDefault();
    
    const viagemData = {
        pacote_id: elements.form.pacoteId.value,
        data_partida: elements.form.dataPartida.value,
        duracao_horas: parseInt(elements.form.duracaoHoras.value),
        capacidade: parseInt(elements.form.capacidade.value),
        descricao: elements.form.descricao.value
    };

    try {
        if (elements.form.id.value) {
            await atualizarViagem(elements.form.id.value, viagemData);
        } else {
            await criarViagem(viagemData);
        }
        
        resetForm();
        carregarViagens();
        elements.tabs.lista.click();
        mostrarAlerta('Viagem salva com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao salvar viagem:', error);
    }
}

async function criarViagem(viagemData) {
    return await fetchAPI('/trips', {
        method: 'POST',
        body: JSON.stringify(viagemData)
    });
}

async function atualizarViagem(id, viagemData) {
    return await fetchAPI(`/trips/${id}`, {
        method: 'PUT',
        body: JSON.stringify(viagemData)
    });
}

async function cancelarViagem(id) {
    try {
        await fetchAPI(`/trips/${id}`, { method: 'DELETE' });
        mostrarAlerta('Viagem cancelada com sucesso!', 'success');
        carregarViagens();
        elements.tabs.lista.click();
    } catch (error) {
        console.error('Erro ao cancelar viagem:', error);
    }
}

async function iniciarViagem(id) {
    try {
        await fetchAPI(`/trips/${id}/start`, { method: 'PUT' });
        mostrarAlerta('Viagem iniciada com sucesso!', 'success');
        await carregarDetalhesViagem(id);
    } catch (error) {
        console.error('Erro ao iniciar viagem:', error);
    }
}

async function concluirViagem(id) {
    try {
        await fetchAPI(`/trips/${id}/complete`, { method: 'PUT' });
        mostrarAlerta('Viagem concluída com sucesso!', 'success');
        await carregarDetalhesViagem(id);
    } catch (error) {
        console.error('Erro ao concluir viagem:', error);
    }
}

function confirmarAcao(mensagem, callback) {
    elements.modal.message.textContent = mensagem;
    acaoConfirmacao = callback;
    elements.modal.el.show();
}

function preencherFormulario(viagem) {
    elements.form.title.textContent = 'Editar Viagem';
    elements.form.id.value = viagem.id;
    elements.form.pacoteId.value = viagem.pacote_id;
    elements.form.dataPartida.value = viagem.data_partida.slice(0, 16);
    elements.form.duracaoHoras.value = viagem.duracao_horas;
    elements.form.capacidade.value = viagem.capacidade;
    elements.form.descricao.value = viagem.descricao;
}

function resetForm() {
    elements.form.title.textContent = 'Nova Viagem';
    elements.form.el.reset();
    elements.form.id.value = '';
}