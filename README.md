# AdAstra Frontend

## Sobre o Projeto

AdAstra é um projeto acadêmico desenvolvido como parte de um trabalho de faculdade. Este repositório contém a parte frontend da aplicação, que se comunica com uma API FastAPI para gerenciamento de clientes, pacotes de viagens espaciais, reservas e aprovações médicas.

## Tecnologias Utilizadas

- HTML5
- CSS3
- JavaScript
- Bootstrap 5
- Fetch API

## Funcionalidades

- Cadastro de novos clientes
- Visualização da lista de clientes
- Edição de dados de clientes existentes
- Exclusão de clientes
- Visualização detalhada de cliente específico
- Gestão de pacotes de viagens espaciais
- Gestão de viagens
- Gestão de reservas
- Gestão de impostos e taxas
- **Aprovação Médica de Clientes**:
  - Visualização da lista de clientes com status médico
  - Registro de novas avaliações médicas
  - Visualização do histórico de avaliações
  - Edição e exclusão de registros médicos
  - Filtro por cliente e status médico
- **Gestão de Certificações**:
  - Visualização da lista de clientes com status de certificação
  - Registro de novas certificações (treinamentos, adaptações, etc.)
  - Verificação de autenticidade de certificados via API externa
  - Acompanhamento de validade das certificações
  - Visualização de histórico completo de certificações
  - Filtros e busca avançada
- **Gestão de Pagamentos**:
  - Visualização e controle de todos os pagamentos realizados
  - Processamento de novos pagamentos com validação
  - Edição e atualização de informações de pagamento
  - Simulação de pagamentos com diferentes métodos
  - Integração com sistema de reservas e pacotes
  - Dashboard com estatísticas de pagamentos

## Pré-requisitos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Python 3.8+ (para servidor local)
- API Backend AdAstra rodando em http://127.0.0.1:8000

## Como Rodar o Programa

### Opção 1: Servidor HTTP Simples com Python

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/AdAstra-Front.git
   cd AdAstra-Front
   ```

2. Inicie um servidor HTTP local:
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Ou Python 2 (se necessário)
   python -m SimpleHTTPServer 8080
   ```

3. Abra seu navegador e acesse:
   ```
   http://localhost:8080
   ```

### Opção 2: Extensão Live Server (VS Code)

1. Instale a extensão "Live Server" no VS Code
2. Abra o projeto no VS Code
3. Clique com o botão direito no arquivo `index.html`
4. Selecione "Open with Live Server"

### Opção 3: Diretamente no Navegador

1. Simplesmente abra o arquivo `index.html` diretamente no navegador
   - **Nota**: Algumas funcionalidades podem não funcionar devido às políticas CORS

## Instalação

1. Clone este repositório:
   ```bash
   git clone https://github.com/seu-usuario/AdAstra-Front.git
   cd AdAstra-Front
   ```

2. Não há necessidade de instalar dependências adicionais, pois o Bootstrap é carregado via CDN.

3. Certifique-se de que a API Backend esteja rodando em `http://127.0.0.1:8000`

## Estrutura do Projeto

```
AdAstra-Front/
├── css/
│   └── styles.css
├── js/
│   ├── cadastroCliente.js
│   ├── cadastroPacote.js
│   ├── cadastroViagem.js
│   ├── cadastroReserva.js
│   ├── aprovacaoMedica.js
│   ├── certificacao.js
│   ├── cadastroImpostos.js
│   └── cadastroPagamento.js
├── index.html
├── cadastroCliente.html
├── cadastroPacote.html
├── cadastroViagem.html
├── cadastroReserva.html
├── aprovacaoMedica.html
├── certificacao.html
├── cadastroImpostos.html
├── cadastroPagamento.html
└── README.md
```

## Conexão com a API

O frontend se comunica com a API através de requisições HTTP usando a Fetch API. A API está disponível em `http://127.0.0.1:8000` e oferece os seguintes endpoints principais:

- **Clientes**:
  - `POST /clientes/` - Criar um novo cliente
  - `GET /clientes/` - Listar todos os clientes
  - `GET /clientes/{cliente_id}` - Obter detalhes de um cliente específico
  - `PUT /clientes/{cliente_id}` - Atualizar dados de um cliente
  - `DELETE /clientes/{cliente_id}` - Excluir um cliente

- **Aprovação Médica**:
  - `POST /medical_clearance/` - Criar uma nova aprovação médica
  - `GET /medical_clearance/{cliente_id}` - Obter histórico de aprovações médicas de um cliente
  - `PUT /medical_clearance/{aprovacao_id}` - Atualizar uma aprovação médica
  - `DELETE /medical_clearance/{aprovacao_id}` - Excluir uma aprovação médica

- **Certificações**:
  - `POST /certifications/` - Criar uma nova certificação
  - `GET /certifications/{cliente_id}` - Obter histórico de certificações de um cliente
  - `PUT /certifications/{certification_id}` - Atualizar uma certificação
  - `POST /api/verifica-certificado` - Verificar autenticidade de certificado com serviço externo

- **Pagamentos**:
  - `GET /payments/` - Listar todos os pagamentos
  - `POST /payments/` - Processar um novo pagamento
  - `GET /payments/{payment_id}` - Obter detalhes de um pagamento específico
  - `PUT /payments/{payment_id}` - Atualizar informações de um pagamento
  - `DELETE /payments/{payment_id}` - Cancelar/excluir um pagamento
  - `POST /payments/simulate` - Simular processamento de pagamento

- **Outros Endpoints**:
  - Endpoints para pacotes, viagens e reservas (consulte a documentação da API para mais detalhes)

## Módulo de Aprovação Médica

O novo módulo de aprovação médica permite aos operadores do sistema:

1. **Visualizar status médico de clientes**: A página principal mostra todos os clientes com seus status médicos atuais (Aprovado, Pendente, Reprovado).

2. **Realizar novas avaliações**: Um formulário intuitivo permite registrar novas avaliações médicas com dados do médico responsável, data, e resultado da avaliação.

3. **Consultar histórico médico**: Visualize todo o histórico de avaliações médicas de cada cliente em uma tabela organizada.

4. **Gerenciar avaliações**: Edite ou exclua avaliações médicas conforme necessário, com confirmações para evitar mudanças acidentais.

## Módulo de Certificações

O módulo de certificações foi desenvolvido para gerenciar os requisitos de treinamento e certificação necessários para viagens espaciais:

1. **Gestão completa de certificações**: Registre, visualize, edite e exclua certificações para cada cliente, como treinamentos espaciais, adaptação à gravidade zero, entre outros.

2. **Verificação de autenticidade**: Integração com serviço externo para verificar a autenticidade das certificações apresentadas pelos clientes.

3. **Monitoramento de validade**: Alertas visuais para certificações próximas do vencimento ou já vencidas, garantindo que todos os clientes estejam com suas certificações em dia.

4. **Dashboard de status**: Visualize rapidamente o status de certificação de cada cliente (Concluída, Em Andamento ou Pendente).

5. **Formulário intuitivo**: Interface amigável para adicionar novas certificações, incluindo campos para data de emissão, validade, entidade emissora e observações.

## Módulo de Pagamentos

O módulo de pagamentos oferece controle financeiro completo para as viagens espaciais:

1. **Gestão completa de pagamentos**: Visualize, processe, edite e cancele pagamentos com interface intuitiva e organizada.

2. **Múltiplos métodos de pagamento**: Suporte para cartão de crédito, débito, PIX, transferência bancária e parcelamento.

3. **Processamento em tempo real**: Sistema de validação de dados e simulação de pagamentos com feedback instantâneo.

4. **Dashboard financeiro**: Acompanhe todos os pagamentos com filtros por status (Pendente, Processando, Aprovado, Recusado) e métodos.

5. **Validação robusta**: Formulários com validação completa de dados financeiros, incluindo verificação de cartões e valores.

6. **Histórico detalhado**: Mantenha registro completo de todas as transações com dados do cliente, valor, método e status.

## Navegação do Sistema

Todas as páginas do sistema incluem uma barra de navegação consistente com acesso rápido a:
- Dashboard principal
- Cadastro de Clientes
- Pacotes de Viagem
- Viagens
- Reservas
- Aprovação Médica
- Certificações
- Impostos e Taxas
- **Pagamentos** (novo módulo)

## Troubleshooting

### Problemas Comuns

1. **Erro CORS**: Se estiver abrindo diretamente no navegador, use um servidor HTTP local
2. **API não responde**: Verifique se o backend está rodando em `http://127.0.0.1:8000`
3. **Formulários não enviam**: Verifique a conexão com a internet e se a API está acessível
4. **Dados não carregam**: Verifique o console do navegador para erros de JavaScript

### Logs e Debug

Abra o console do navegador (F12) para visualizar logs detalhados e mensagens de erro.

## Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/NovaFeature`)
5. Abra um Pull Request

## Versões

- **v1.0.0** - Versão inicial com cadastro de clientes
- **v1.1.0** - Adicionados módulos de pacotes, viagens e reservas
- **v1.2.0** - Implementados módulos de aprovação médica e certificações
- **v1.3.0** - Adicionado módulo de impostos e taxas
- **v1.4.0** - Implementado módulo completo de pagamentos

## Status do Projeto

✅ **Funcional** - Todos os módulos implementados e testados
- Interface responsiva e moderna
- Integração completa com API Backend
- Validação robusta de formulários
- Navegação consistente entre módulos
- Sistema de notificações e alertas

## Demonstração

Para testar o sistema completo:

1. **Acesse o Dashboard**: `http://localhost:8080` - Visualize o painel principal com cards de todos os módulos
2. **Teste Pagamentos**: Clique em "Pagamentos" para acessar o novo módulo financeiro
3. **Navegue entre módulos**: Use a barra de navegação superior para alternar entre funcionalidades
4. **Teste formulários**: Experimente criar, editar e excluir registros em cada módulo
5. **Verifique responsividade**: Teste em diferentes tamanhos de tela

### URLs Principais

- **Dashboard**: `http://localhost:8080/`
- **Clientes**: `http://localhost:8080/cadastroCliente.html`
- **Pagamentos**: `http://localhost:8080/cadastroPagamento.html`
- **Aprovação Médica**: `http://localhost:8080/aprovacaoMedica.html`
- **Certificações**: `http://localhost:8080/certificacao.html`

## Tecnologias e Dependências

### Frontend
- **HTML5**: Estrutura semântica das páginas
- **CSS3**: Estilos customizados em `css/styles.css`
- **Bootstrap 5.3.0**: Framework CSS via CDN
- **Bootstrap Icons**: Iconografia via CDN
- **JavaScript ES6+**: Funcionalidades interativas

### APIs Utilizadas
- **Fetch API**: Comunicação com backend
- **FastAPI Backend**: Servidor de dados em Python
- **JSON**: Formato de troca de dados

### Recursos Externos
- **Bootstrap CDN**: `https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/`
- **Bootstrap Icons**: `https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/`

## Autores

- Seu Nome - [seu-email@exemplo.com](mailto:seu-email@exemplo.com)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE.md para detalhes.

## Agradecimentos

- Professores e orientadores
- Instituição de ensino
````
