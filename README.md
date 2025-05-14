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

## Pré-requisitos

- Navegador web moderno
- API Backend rodando em http://127.0.0.1:8000

## Instalação

1. Clone este repositório:
   ```
   git clone https://github.com/seu-usuario/AdAstra-Front.git
   cd AdAstra-Front
   ```

2. Não há necessidade de instalar dependências adicionais, pois o Bootstrap é carregado via CDN.

3. Abra o arquivo `index.html` em seu navegador ou sirva os arquivos usando um servidor web simples.

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
│   └── certificacao.js
├── index.html
├── cadastroCliente.html
├── cadastroPacote.html
├── cadastroViagem.html
├── cadastroReserva.html
├── aprovacaoMedica.html
├── certificacao.html
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

## Autores

- Seu Nome - [seu-email@exemplo.com](mailto:seu-email@exemplo.com)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE.md para detalhes.

## Agradecimentos

- Professores e orientadores
- Instituição de ensino
````
