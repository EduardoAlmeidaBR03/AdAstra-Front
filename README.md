# AdAstra Frontend

## Sobre o Projeto

AdAstra é um projeto acadêmico desenvolvido como parte de um trabalho de faculdade. Este repositório contém a parte frontend da aplicação, que se comunica com uma API FastAPI para gerenciamento de clientes.

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
│   └── main.js
├── index.html
└── README.md
```

## Conexão com a API

O frontend se comunica com a API através de requisições HTTP usando a Fetch API. A API está disponível em `http://127.0.0.1:8000` e oferece os seguintes endpoints para clientes:

- `POST /clientes/` - Criar um novo cliente
- `GET /clientes/` - Listar todos os clientes
- `GET /clientes/{cliente_id}` - Obter detalhes de um cliente específico
- `PUT /clientes/{cliente_id}` - Atualizar dados de um cliente
- `DELETE /clientes/{cliente_id}` - Excluir um cliente

## Autores

- Seu Nome - [seu-email@exemplo.com](mailto:seu-email@exemplo.com)

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE.md para detalhes.

## Agradecimentos

- Professores e orientadores
- Instituição de ensino