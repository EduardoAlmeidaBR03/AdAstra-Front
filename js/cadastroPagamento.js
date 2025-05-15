// Configuração da API
const API_URL = "http://127.0.0.1:8000";

// Elementos DOM
const elements = {
  tabs: {
    lista: document.getElementById("lista-tab"),
    cadastro: document.getElementById("cadastro-tab"),
    detalhes: document.getElementById("detalhes-tab"),
    simulacao: document.getElementById("simulacao-tab"),
  },
  loaders: {
    lista: document.getElementById("listaLoader"),
    detalhes: document.getElementById("detalhesLoader"),
  },
  lista: {
    container: document.getElementById("listaPagamentos"),
    btnRecarregar: document.getElementById("btnRecarregarLista"),
  },
  form: {
    el: document.getElementById("formPagamento"),
    title: document.getElementById("formTitle"),
    id: document.getElementById("pagamentoId"),
    bookingId: document.getElementById("bookingId"),
    btnBuscarReserva: document.getElementById("btnBuscarReserva"),
    clienteNome: document.getElementById("clienteNome"),
    valor: document.getElementById("valor"),
    moedaId: document.getElementById("moedaId"),
    status: document.getElementById("status"),
    btnCancelar: document.getElementById("btnCancelar"),
    btnSalvar: document.getElementById("btnSalvar"),
  },
  detalhes: {
    container: document.getElementById("detalhesPagamento"),
    id: document.getElementById("detalhesPagamentoId"),
    status: document.getElementById("detalhesStatus"),
    bookingId: document.getElementById("detalhesBookingId"),
    cliente: document.getElementById("detalhesCliente"),
    valor: document.getElementById("detalhesValor"),
    moeda: document.getElementById("detalhesMoeda"),
    dataCriacao: document.getElementById("detalhesDataCriacao"),
    btnPagar: document.getElementById("btnPagar"),
    btnEditar: document.getElementById("btnEditar"),
    btnExcluir: document.getElementById("btnExcluir"),
  },
  simulacao: {
    form: document.getElementById("formSimulacao"),
    bookingId: document.getElementById("simBookingId"),
    valor: document.getElementById("simValor"),
    moedaCodigo: document.getElementById("simMoedaCodigo"),
    resultado: document.getElementById("resultadoSimulacao"),
    resultStatus: document.getElementById("resultStatus"),
    resultTransactionId: document.getElementById("resultTransactionId"),
    resultMensagem: document.getElementById("resultMensagem"),
    btnNovaSimulacao: document.getElementById("btnNovaSimulacao"),
  },
  modal: {
    el: new bootstrap.Modal(document.getElementById("confirmModal")),
    message: document.getElementById("confirmMessage"),
    btnConfirm: document.getElementById("btnConfirmAction"),
  },
};

// Variáveis de estado
let pagamentoAtual = null;
let acaoConfirmacao = null;
let moedas = [];

// Inicialização da aplicação
document.addEventListener("DOMContentLoaded", () => {
  // Carregar lista de pagamentos
  carregarPagamentos();

  // Carregar lista de moedas para os selects
  carregarMoedas();

  // Configurar eventos
  setupEventListeners();

  console.log("AdAstra - Sistema de Gestão de Pagamentos inicializado");
});

// Configuração de todos os event listeners
function setupEventListeners() {
  // Botão recarregar lista
  elements.lista.btnRecarregar.addEventListener("click", carregarPagamentos);

  // Form de cadastro/edição
  elements.form.el.addEventListener("submit", handleFormSubmit);
  elements.form.btnCancelar.addEventListener("click", resetForm);
  elements.form.btnBuscarReserva.addEventListener("click", buscarReserva);
  // Adicionar validação em tempo real
  elements.form.bookingId.addEventListener("blur", validateField);
  elements.form.valor.addEventListener("blur", validateField);
  elements.form.moedaId.addEventListener("change", validateField);
  elements.form.status.addEventListener("change", validateField);
  // Botões de ações na tela de detalhes
  elements.detalhes.btnEditar.addEventListener("click", () => {
    if (pagamentoAtual) {
      preencherFormulario(pagamentoAtual);
      elements.tabs.cadastro.click();
    }
  });

  elements.detalhes.btnExcluir.addEventListener("click", () => {
    if (pagamentoAtual) {
      confirmarAcao(
        `Tem certeza que deseja excluir o pagamento ${pagamentoAtual.id}?`,
        () => excluirPagamento(pagamentoAtual.id)
      );
    }
  });

  // Botão de Pagamento (Mercado Pago) na tela de detalhes
  elements.detalhes.btnPagar.addEventListener("click", () => {
    if (pagamentoAtual && pagamentoAtual.status === "Pendente") {
      console.log("Botão Pagar clicado, redirecionando...", pagamentoAtual.booking_id);
      processarPagamentoMercadoPago(pagamentoAtual.booking_id);
    }
  });

  // Form de simulação
  elements.simulacao.form.addEventListener("submit", handleSimulacao);
  elements.simulacao.btnNovaSimulacao.addEventListener("click", resetSimulacao);

  // Confirmação de ação
  elements.modal.btnConfirm.addEventListener("click", () => {
    if (acaoConfirmacao) {
      acaoConfirmacao();
      elements.modal.el.hide();
    }
  });
}

// Funções para manipular a UI
function exibirLoader(loader, show = true) {
  loader.classList.toggle("d-none", !show);
}

function mostrarAlerta(mensagem, tipo = "success", duracao = 5000) {
  const alertContainer = document.querySelector(".alert-container");

  const alertEl = document.createElement("div");
  alertEl.className = `alert alert-${tipo} alert-dismissible fade show`;
  alertEl.role = "alert";

  alertEl.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
    `;

  alertContainer.appendChild(alertEl);

  // Se for um erro, também mostra no formulário
  if (tipo === "danger") {
    const formErrorArea = document.getElementById("formErrorArea");
    if (formErrorArea) {
      formErrorArea.textContent = mensagem;
      formErrorArea.style.display = "block";

      // Esconder após duração
      setTimeout(() => {
        formErrorArea.style.display = "none";
      }, duracao);
    }
  }

  // Auto-remover após a duração
  setTimeout(() => {
    alertEl.classList.remove("show");
    setTimeout(() => alertEl.remove(), 300);
  }, duracao);
}

// Funções para comunicação com a API
async function fetchAPI(endpoint, options = {}) {
  try {
    // Log da requisição para depuração
    console.group(`API Request: ${options.method || "GET"} ${endpoint}`);
    console.log("URL:", `${API_URL}${endpoint}`);
    console.log("Options:", {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (options.body) {
      try {
        console.log("Request Body:", JSON.parse(options.body));
      } catch (e) {
        console.log("Request Body (raw):", options.body);
      }
    }

    const startTime = Date.now();
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    const endTime = Date.now();
    console.log(
      `Response Status: ${response.status} (${response.statusText}) - ${
        endTime - startTime
      }ms`
    );

    // Para DELETE retornamos apenas o status
    if (options.method === "DELETE") {
      console.log("Response: Success (DELETE operation)");
      console.groupEnd();
      return { success: response.ok };
    }

    // Para outros métodos, tratamos os erros adequadamente
    if (!response.ok) {
      let errorMessage = `Erro HTTP ${response.status}`;

      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
        console.error("Response Error Details:", errorData);
      } catch (e) {
        // Se não conseguir ler o corpo como JSON, usa a mensagem padrão
        console.error("Could not parse error response as JSON");
      }

      console.groupEnd();
      throw new Error(errorMessage);
    }

    // Para requisições que não retornam dados (204 No Content)
    if (response.status === 204) {
      console.log("Response: Success (No Content)");
      console.groupEnd();
      return { success: true };
    }

    const data = await response.json();
    console.log("Response Data:", data);
    console.groupEnd();
    return data;
  } catch (error) {
    console.error("API Communication Error:", error);

    // Tratamento específico para erros de rede
    if (error.name === "TypeError" && error.message === "Failed to fetch") {
      mostrarAlerta(
        "Erro de conexão. Verifique se o servidor da API está acessível.",
        "danger"
      );
    } else {
      mostrarAlerta(`Erro: ${error.message}`, "danger");
    }

    console.groupEnd(); // Fechar grupo de logs em caso de erro
    throw error;
  }
}

// Funções principais de CRUD
async function carregarPagamentos() {
  try {
    exibirLoader(elements.loaders.lista, true);
    elements.lista.container.innerHTML = "";

    const pagamentos = await fetchAPI("/payments/");

    if (pagamentos.length === 0) {
      elements.lista.container.innerHTML = `
                <div class="col-12 text-center">
                    <div class="alert alert-info">
                        Nenhum pagamento cadastrado. Clique em "Novo Pagamento" para adicionar.
                    </div>
                </div>
            `;
    } else {
      renderizarListaPagamentos(pagamentos);
    }
  } catch (error) {
    console.error("Erro ao carregar pagamentos:", error);
    elements.lista.container.innerHTML = `
            <div class="col-12 text-center">
                <div class="alert alert-danger">
                    Erro ao carregar pagamentos: ${error.message}
                </div>
            </div>
        `;
  } finally {
    exibirLoader(elements.loaders.lista, false);
  }
}

function renderizarListaPagamentos(pagamentos) {
  elements.lista.container.innerHTML = "";
  // Função para obter informações da reserva e pacote (assíncrona)
  const obterInfoReserva = async (bookingId) => {
    try {
      // Buscar informações da reserva
      const reserva = await fetchAPI(`/bookings/${bookingId}`);

      // Buscar informações do cliente usando o cliente_id da reserva
      const cliente = await fetchAPI(`/clientes/${reserva.cliente_id}`);

      // Buscar informações do pacote associado
      const pacote = await fetchAPI(`/packages/${reserva.package_id}`);

      return {
        clienteNome: cliente.nome || "Cliente não disponível",
        pacoteNome: pacote.nome || "Pacote não disponível",
      };
    } catch (error) {
      console.error(
        `Erro ao obter informações da reserva ${bookingId}:`,
        error
      );
      return {
        clienteNome: "Cliente não disponível",
        pacoteNome: "Pacote não disponível",
      };
    }
  };

  // Para cada pagamento, renderizar card
  pagamentos.forEach(async (pagamento) => {
    const pagamentoCard = document.createElement("div");
    pagamentoCard.className = "col-md-4 mb-4";

    // Formatar data
    const dataCriacao = new Date(pagamento.data_criacao).toLocaleDateString(
      "pt-BR"
    );

    // Formatação do status para badges
    const statusBadge = formatarStatusPagamento(pagamento.status);

    // Inicialmente, criar card com placeholder para o nome do pacote e cliente
    pagamentoCard.innerHTML = `
            <div class="card pagamento-card h-100 shadow-sm">
                <div class="card-header bg-primary text-white d-flex align-items-center">
                    <i class="bi bi-credit-card me-2"></i>
                    <h5 class="card-title mb-0">Carregando...</h5>
                </div>
                <div class="card-body">
                    <p class="mb-2"><i class="bi bi-person text-muted me-2"></i> Cliente: <span class="cliente-nome">Carregando...</span></p>
                    <p class="mb-2"><i class="bi bi-bookmark text-muted me-2"></i> Reserva: ${
                      pagamento.booking_id
                    }</p>
                    <p class="mb-2"><i class="bi bi-cash-stack text-muted me-2"></i> Valor: ${formatarValor(
                      pagamento.valor,
                      getMoedaSimbolo(pagamento.moeda_id)
                    )}</p>
                    <p class="mb-2"><i class="bi bi-calendar text-muted me-2"></i> Data: ${dataCriacao}</p>
                    <p class="mb-0"><i class="bi bi-flag text-muted me-2"></i> Status: ${statusBadge}</p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-flex justify-content-end gap-2">
                        <button class="btn btn-sm btn-outline-primary btn-action btn-visualizar" data-id="${
                          pagamento.id
                        }">
                            <i class="bi bi-eye"></i> Visualizar
                        </button>
                        ${
                          pagamento.status === "Pendente"
                            ? `<button class="btn btn-sm btn-success btn-action btn-pagar" data-booking-id="${pagamento.booking_id}">
                                <i class="bi bi-credit-card"></i> Pagar
                              </button>`
                            : ""
                        }
                        <button class="btn btn-sm btn-outline-danger btn-action btn-remover" data-id="${
                          pagamento.id
                        }">
                            <i class="bi bi-trash"></i> Remover
                        </button>
                    </div>
                </div>
            </div>
        `;

    elements.lista.container.appendChild(pagamentoCard); // Adicionar event listeners aos botões
    const btnVisualizar = pagamentoCard.querySelector(".btn-visualizar");
    btnVisualizar.addEventListener("click", () =>
      carregarDetalhesPagamento(pagamento.id)
    );    // Adicionar event listener para o botão Pagar (apenas para status PENDENTE)
    if (pagamento.status === "Pendente") {
      const btnPagar = pagamentoCard.querySelector(".btn-pagar");
      if (btnPagar) {
        btnPagar.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log("Botão Pagar clicado, redirecionando...", pagamento.booking_id);
          processarPagamentoMercadoPago(pagamento.booking_id);
        });
      } else {
        console.warn("Botão Pagar não encontrado para pagamento com status PENDENTE:", pagamento);
      }
    }

    const btnRemover = pagamentoCard.querySelector(".btn-remover");
    btnRemover.addEventListener("click", () => {
      confirmarAcao(
        `Tem certeza que deseja excluir o pagamento #${pagamento.id}?`,
        () => excluirPagamento(pagamento.id)
      );
    });

    // Obter e atualizar informações da reserva/pacote
    try {
      const info = await obterInfoReserva(pagamento.booking_id);

      // Atualizar título do card com o nome do pacote
      const cardTitle = pagamentoCard.querySelector(".card-title");
      if (cardTitle) {
        cardTitle.textContent = info.pacoteNome;
      }

      // Atualizar o nome do cliente
      const clienteNomeElement = pagamentoCard.querySelector(".cliente-nome");
      if (clienteNomeElement) {
        clienteNomeElement.textContent = info.clienteNome;
      }
    } catch (error) {
      console.error(
        "Erro ao atualizar informações do pacote e cliente:",
        error
      );
    }
  });
}

async function carregarDetalhesPagamento(pagamentoId) {
  try {
    exibirLoader(elements.loaders.detalhes, true);
    elements.detalhes.container.style.display = "none";

    const pagamento = await fetchAPI(`/payments/${pagamentoId}`);
    pagamentoAtual = pagamento;

    // Obter informações da reserva e cliente
    let clienteNome = "Cliente não disponível";
    try {
      // Buscar informações da reserva
      const reserva = await fetchAPI(`/bookings/${pagamento.booking_id}`);
      // Buscar informações do cliente
      const cliente = await fetchAPI(`/clientes/${reserva.cliente_id}`);
      clienteNome = cliente.nome;
    } catch (error) {
      console.error("Erro ao obter informações do cliente:", error);
    }

    // Formatar data
    const dataCriacao = new Date(pagamento.data_criacao).toLocaleDateString(
      "pt-BR"
    );

    // Preencher detalhes
    elements.detalhes.id.textContent = pagamento.id;
    elements.detalhes.status.innerHTML = formatarStatusPagamento(
      pagamento.status
    );
    elements.detalhes.bookingId.textContent = pagamento.booking_id;
    elements.detalhes.cliente.textContent = clienteNome;
    elements.detalhes.valor.textContent = formatarValor(
      pagamento.valor,
      getMoedaSimbolo(pagamento.moeda_id)
    );
    elements.detalhes.moeda.textContent = getMoedaNome(pagamento.moeda_id);
    elements.detalhes.dataCriacao.textContent = dataCriacao;

    // Configurar botões de ação com base no status
    if (pagamento.status === "Pendente") {
      // Adicionar botão de pagar se o status for PENDENTE
      elements.detalhes.btnPagar.style.display = "inline-block";
      elements.detalhes.btnPagar.setAttribute(
        "data-booking-id",
        pagamento.booking_id
      );
    } else {
      // Esconder o botão de pagar para outros status
      elements.detalhes.btnPagar.style.display = "none";
    }

    // Mostrar aba de detalhes
    elements.tabs.detalhes.click();
    elements.detalhes.container.style.display = "block";
  } catch (error) {
    console.error("Erro ao carregar detalhes do pagamento:", error);
    mostrarAlerta(`Erro ao carregar detalhes: ${error.message}`, "danger");
  } finally {
    exibirLoader(elements.loaders.detalhes, false);
  }
}

async function buscarReserva() {
  const bookingId = elements.form.bookingId.value.trim();

  if (!bookingId) {
    mostrarAlerta("Por favor, informe o ID da reserva", "warning");
    return;
  }

  try {
    // Buscar dados reais da reserva
    const reserva = await fetchAPI(`/bookings/${bookingId}`);

    // Buscar informações do cliente
    let clienteNome = "Cliente não disponível";
    try {
      const cliente = await fetchAPI(`/clientes/${reserva.cliente_id}`);
      clienteNome = cliente.nome;
    } catch (error) {
      console.error("Erro ao obter informações do cliente:", error);
    }

    // Preencher campos relacionados à reserva
    elements.form.clienteNome.value = clienteNome;
    elements.form.valor.value = reserva.valor_total || 0;
  } catch (error) {
    console.error("Erro ao buscar reserva:", error);
    mostrarAlerta(`Reserva não encontrada: ${error.message}`, "danger");
  }
}

async function handleFormSubmit(event) {
  event.preventDefault();

  // Impedir envio duplo desabilitando o botão
  elements.form.btnSalvar.disabled = true;

  try {
    const isEdicao = elements.form.id.value !== "";

    // Validar todos os campos obrigatórios
    let isFormValid = true; // Lista de campos a validar
    const fieldsToValidate = [
      elements.form.bookingId,
      elements.form.valor,
      elements.form.moedaId,
      elements.form.status,
    ];

    // Validar cada campo
    fieldsToValidate.forEach((field) => {
      const event = { target: field };
      if (!validateField(event)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      throw new Error("Por favor, corrija os erros no formulário");
    }
    const formData = {
      booking_id: elements.form.bookingId.value.trim(),
      valor: parseFloat(elements.form.valor.value),
      moeda_id: elements.form.moedaId.value,
      status: elements.form.status.value,
    };

    if (isEdicao) {
      // Atualizar pagamento existente
      await fetchAPI(`/payments/${elements.form.id.value}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      mostrarAlerta("Pagamento atualizado com sucesso!");
    } else {
      // Criar novo pagamento
      await fetchAPI("/payments/", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      mostrarAlerta("Pagamento registrado com sucesso!");
    }

    // Resetar formulário e voltar para lista
    resetForm();
    await carregarPagamentos();
    elements.tabs.lista.click();
  } catch (error) {
    console.error("Erro ao salvar pagamento:", error);
    mostrarAlerta(`Erro ao salvar pagamento: ${error.message}`, "danger");
  } finally {
    // Re-habilitar o botão após o processamento
    elements.form.btnSalvar.disabled = false;
  }
}

async function excluirPagamento(pagamentoId) {
  try {
    await fetchAPI(`/payments/${pagamentoId}`, {
      method: "DELETE",
    });

    mostrarAlerta("Pagamento excluído com sucesso!");

    // Voltar para a lista e recarregar
    elements.tabs.lista.click();
    await carregarPagamentos();
  } catch (error) {
    console.error("Erro ao excluir pagamento:", error);
    mostrarAlerta(`Erro ao excluir: ${error.message}`, "danger");
  }
}

async function handleSimulacao(event) {
  event.preventDefault();

  try {
    // Validar campos
    if (
      !elements.simulacao.bookingId.value ||
      !elements.simulacao.valor.value ||
      !elements.simulacao.moedaCodigo.value
    ) {
      throw new Error("Preencha todos os campos obrigatórios");
    }

    const bookingId = elements.simulacao.bookingId.value.trim();
    const valor = parseFloat(elements.simulacao.valor.value);
    const moedaCodigo = elements.simulacao.moedaCodigo.value;

    // Chamar API para simulação
    const resultado = await fetchAPI(
      `/payments/api/pagamento?booking_id=${encodeURIComponent(
        bookingId
      )}&valor=${valor}&moeda_codigo=${moedaCodigo}`,
      {
        method: "POST",
      }
    );

    // Mostrar resultado
    elements.simulacao.resultStatus.textContent = resultado.status;
    elements.simulacao.resultTransactionId.textContent =
      resultado.transaction_id || "-";

    // Configurar mensagem com classe de alerta apropriada
    elements.simulacao.resultMensagem.className = "alert";
    elements.simulacao.resultMensagem.classList.add(
      resultado.success ? "alert-success" : "alert-danger"
    );
    elements.simulacao.resultMensagem.textContent = resultado.message;

    // Mostrar resultado e esconder formulário
    elements.simulacao.resultado.style.display = "block";
    elements.simulacao.form.style.display = "none";
  } catch (error) {
    console.error("Erro na simulação de pagamento:", error);
    mostrarAlerta(`Erro na simulação: ${error.message}`, "danger");
  }
}

function resetSimulacao() {
  // Limpar formulário e mostrar novamente
  elements.simulacao.form.reset();
  elements.simulacao.form.style.display = "block";

  // Esconder resultados
  elements.simulacao.resultado.style.display = "none";
}

async function preencherFormulario(pagamento) {
  // Configurar modo de edição
  elements.form.title.textContent = "Editar Pagamento";
  elements.form.id.value = pagamento.id;
  // Preencher campos
  elements.form.bookingId.value = pagamento.booking_id;
  elements.form.valor.value = pagamento.valor;
  elements.form.moedaId.value = pagamento.moeda_id;
  elements.form.status.value = pagamento.status;

  // Buscar e preencher informações do cliente
  try {
    const reserva = await fetchAPI(`/bookings/${pagamento.booking_id}`);
    const cliente = await fetchAPI(`/clientes/${reserva.cliente_id}`);
    elements.form.clienteNome.value = cliente.nome;
  } catch (error) {
    console.error("Erro ao obter informações do cliente:", error);
    elements.form.clienteNome.value = "Cliente não disponível";
  }
}

function resetForm() {
  // Resetar formulário
  elements.form.el.reset();
  elements.form.id.value = "";
  elements.form.clienteNome.value = "";

  // Voltar para modo de criação
  elements.form.title.textContent = "Registrar Novo Pagamento";
  // Remover classes de validação
  const campos = [
    elements.form.bookingId,
    elements.form.valor,
    elements.form.moedaId,
    elements.form.status,
  ];

  campos.forEach((campo) => {
    campo.classList.remove("is-invalid", "is-valid");
  });
}

function confirmarAcao(mensagem, callback) {
  elements.modal.message.textContent = mensagem;
  acaoConfirmacao = callback;
  elements.modal.el.show();
}

// Carregar lista de moedas do banco de dados
async function carregarMoedas() {
  try {
    // Buscar as moedas da API usando o endpoint currencies    // Buscar as moedas da API usando o endpoint currencies
    moedas = await fetchAPI("/currencies/");

    // Preencher select de moedas no formulário principal
    const selectMoeda = elements.form.moedaId;
    selectMoeda.innerHTML =
      '<option value="" selected disabled>Selecione a moeda</option>';

    // Preencher select de moedas no formulário de simulação
    const selectMoedaSimulacao = elements.simulacao.moedaCodigo;
    selectMoedaSimulacao.innerHTML =
      '<option value="" selected disabled>Selecione a moeda</option>';

    moedas.forEach((moeda) => {
      // Adicionar ao formulário principal
      const option = document.createElement("option");
      option.value = moeda.id;
      option.textContent = `${moeda.codigo} - ${moeda.nome}`;
      selectMoeda.appendChild(option);

      // Adicionar ao formulário de simulação
      const optionSimulacao = document.createElement("option");
      optionSimulacao.value = moeda.codigo;
      optionSimulacao.textContent = `${moeda.codigo} - ${moeda.nome}`;
      selectMoedaSimulacao.appendChild(optionSimulacao);
    });
  } catch (error) {
    console.error("Erro ao carregar moedas:", error);
  }
}

// Funções auxiliares de formatação
function formatarStatusPagamento(status) {
  const statusMap = {
    PENDENTE: {
      text: "Pendente",
      color: "warning",
      icon: "bi-exclamation-triangle-fill",
    },
    PROCESSANDO: {
      text: "Processando",
      color: "info",
      icon: "bi-arrow-repeat",
    },
    CONFIRMADO: {
      text: "Confirmado",
      color: "success",
      icon: "bi-check-circle-fill",
    },
    FALHOU: {
      text: "Falhou",
      color: "danger",
      icon: "bi-x-circle-fill",
    },
    CANCELADO: {
      text: "Cancelado",
      color: "secondary",
      icon: "bi-dash-circle-fill",
    },
  };

  const statusInfo = statusMap[status] || {
    text: status,
    color: "secondary",
    icon: "bi-question-circle",
  };
  return `<span class="badge bg-${statusInfo.color}"><i class="bi ${statusInfo.icon} me-1"></i>${statusInfo.text}</span>`;
}

function formatarValor(valor, simbolo = "$") {
  return `${simbolo} ${parseFloat(valor).toFixed(2)}`;
}

function getMoedaSimbolo(moedaId) {
  const moeda = moedas.find((m) => m.id === moedaId);
  return moeda ? moeda.simbolo : "$";
}

function getMoedaNome(moedaId) {
  const moeda = moedas.find((m) => m.id === moedaId);
  return moeda ? `${moeda.codigo} - ${moeda.nome}` : `Moeda ID: ${moedaId}`;
}

// Validação de campos
function validateField(event) {
  const campo = event.target;
  const valor = campo.value.trim();

  // Reset estado anterior
  campo.classList.remove("is-invalid", "is-valid");

  // Validação específica para cada campo
  switch (campo.id) {
    case "bookingId":
    case "simBookingId":
      if (!valor) {
        campo.classList.add("is-invalid");
        return false;
      }
      campo.classList.add("is-valid");
      return true;

    case "valor":
    case "simValor":
      if (!valor || isNaN(parseFloat(valor)) || parseFloat(valor) <= 0) {
        campo.classList.add("is-invalid");
        return false;
      }
      campo.classList.add("is-valid");
      return true;
    case "moedaId":
    case "simMoedaCodigo":
    case "status":
      if (!valor) {
        campo.classList.add("is-invalid");
        return false;
      }
      campo.classList.add("is-valid");
      return true;

    default:
      return true;
  }
}

async function processarPagamentoMercadoPago(bookingId) {
  try {
    if (!bookingId) {
      throw new Error("ID de reserva inválido");
    }

    // Exibir mensagem informativa
    mostrarAlerta("Processando pagamento...", "info");

    // Fazer requisição POST para obter o link de pagamento
    const mercadoPagoEndpoint = `/payments/mercadopago/create_preference?booking_id=${bookingId}`;
    console.log(`Fazendo requisição POST para: ${API_URL}${mercadoPagoEndpoint}`);
    
    // Usar a função fetchAPI para fazer a requisição POST
    const response = await fetchAPI(mercadoPagoEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Verificar se a resposta contém um link para redirecionar
    if (response && response.init_point) {
      console.log(`Redirecionando para: ${response.init_point}`);
      
      // Mostrar alerta de sucesso antes de redirecionar
      mostrarAlerta("Redirecionando para o gateway de pagamento...", "success");
      
      // Redirecionar para a página de pagamento do Mercado Pago
      window.location.href = response.init_point;
    } else {
      throw new Error("Resposta do servidor não contém um link de pagamento válido");
    }
  } catch (error) {
    console.error("Erro ao processar pagamento via Mercado Pago:", error);
    mostrarAlerta(`Erro ao iniciar pagamento: ${error.message}`, "danger");
  }
}
