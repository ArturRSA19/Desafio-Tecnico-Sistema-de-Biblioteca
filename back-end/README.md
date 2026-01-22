# 📚 Sistema de Biblioteca - Backend

Sistema backend completo para gerenciamento de biblioteca com controle de reservas, validações de negócio e cálculo de multas por atraso.

## 🚀 Tecnologias

- **NestJS** 11.x - Framework Node.js progressivo
- **Prisma** 5.x - ORM moderna para TypeScript
- **MongoDB** - Banco de dados NoSQL
- **TypeScript** - Linguagem fortemente tipada
- **Jest** - Framework de testes
- **class-validator** - Validação de DTOs
- **class-transformer** - Transformação de dados

## 📋 Requisitos

Antes de iniciar, certifique-se de ter instalado:

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local ou Atlas)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd back-end
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="mongodb://localhost:27017/biblioteca"
```

**Variáveis de Ambiente:**

| Variável | Descrição | Obrigatória | 
|----------|-----------|-------------|
| `DATABASE_URL` | URL de conexão do MongoDB para Prisma | Sim |

### 4. Configure o Prisma

```bash
# Gera o Prisma Client
npx prisma generate

# Sincroniza o schema com o banco (desenvolvimento)
npx prisma db push
```

## ▶️ Executando o Projeto

### Modo Desenvolvimento

```bash
npm run start:dev
```

O servidor iniciará em `http://localhost:3000`

### Modo Produção

```bash
# Build
npm run build

# Start
npm run start:prod
```

## 🧪 Testes

### Executar todos os testes

```bash
npm test
```

### Executar testes com coverage

```bash
npm run test:cov
```

### Executar testes específicos

```bash
# Módulo de Clientes
npm test clientes.service.spec.ts

# Módulo de Livros
npm test livros.service.spec.ts

# Módulo de Reservas
npm test reservas.service.spec.ts
```

### Cobertura de Testes

O projeto possui **60 testes unitários** cobrindo todas as regras de negócio:

- **17 testes** - ClientesService
- **18 testes** - LivrosService  
- **25 testes** - ReservasService

## 📦 Scripts Disponíveis

```bash
# Build
npm run build          # Compila o projeto

# Desenvolvimento
npm run start          # Inicia o servidor
npm run start:dev      # Modo watch

# Testes
npm test               # Executa os testes
npm run test:cov       # Testes com coverage

# Linting e Formatação
npm run lint           # Verifica problemas de código
npm run format         # Formata o código com Prettier

# Prisma
npx prisma generate    # Gera o Prisma Client
npx prisma db push     # Sincroniza schema com banco
npx prisma studio      # Interface visual do banco
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── clientes/           # Módulo de Clientes
│   ├── dto/           # Data Transfer Objects
│   ├── utils/         # Utilitários (validação CPF)
│   ├── clientes.controller.ts
│   ├── clientes.service.ts
│   ├── clientes.service.spec.ts
│   └── clientes.module.ts
│
├── livros/            # Módulo de Livros
│   ├── dto/
│   ├── livros.controller.ts
│   ├── livros.service.ts
│   ├── livros.service.spec.ts
│   └── livros.module.ts
│
├── reservas/          # Módulo de Reservas
│   ├── dto/
│   ├── reservas.controller.ts
│   ├── reservas.service.ts
│   ├── reservas.service.spec.ts
│   └── reservas.module.ts
│
├── prisma/            # Configuração do Prisma
│   ├── prisma.service.ts
│   └── prisma.module.ts
│
├── app.module.ts      # Módulo principal
└── main.ts            # Ponto de entrada

prisma/
└── schema.prisma      # Schema do banco de dados
```

### Padrão de Arquitetura

O projeto segue a **arquitetura em camadas do NestJS**:

#### 1. **Controllers** (Camada de Apresentação)
- Responsáveis apenas por orquestração HTTP
- Validam DTOs com class-validator
- Retornam respostas HTTP apropriadas
- **Não contêm regras de negócio**

#### 2. **Services** (Camada de Negócio)
- Contêm toda a lógica de negócio
- Realizam validações complexas
- Interagem com o Prisma Service
- São testáveis unitariamente

#### 3. **Prisma Service** (Camada de Dados)
- Abstração do banco de dados
- Gerencia conexões e transações
- Provê acesso ao Prisma Client

#### 4. **DTOs** (Data Transfer Objects)
- Definem contratos de entrada/saída
- Validação declarativa com decorators
- Type-safety em toda aplicação

## 📡 Endpoints da API

### Clientes

```
POST   /clientes           # Criar cliente
GET    /clientes           # Listar todos os clientes
GET    /clientes/:id       # Buscar cliente por ID
PATCH  /clientes/:id       # Atualizar cliente
DELETE /clientes/:id       # Remover cliente
```

### Livros

```
POST   /livros                      # Criar livro
GET    /livros                      # Listar livros
GET    /livros?disponivel=true      # Filtrar por disponibilidade
GET    /livros/:id                  # Buscar livro por ID
PATCH  /livros/:id                  # Atualizar livro
DELETE /livros/:id                  # Remover livro (se disponível)
```

### Reservas

```
POST   /reservas                    # Criar reserva
GET    /reservas                    # Listar todas as reservas
GET    /reservas/em-atraso          # Listar reservas em atraso
GET    /reservas/cliente/:clienteId # Listar reservas de um cliente
GET    /reservas/:id                # Buscar reserva por ID
PATCH  /reservas/:id/devolver       # Registrar devolução
```

## 🎯 Decisões Técnicas

### 1. **NestJS**
- Framework maduro e opinativo
- Arquitetura modular escalável
- Excelente integração com TypeScript
- Sistema de injeção de dependências robusto
- Facilita testes unitários

### 2. **Prisma ORM**
- Type-safety completa
- Migrations automáticas
- Schema declarativo
- Suporte nativo ao MongoDB
- Cliente gerado automaticamente

### 3. **MongoDB**
- Escalabilidade horizontal
- Flexibilidade do modelo de documentos
- Performance em operações de leitura
- Ideal para prototipagem rápida

### 4. **Validação com class-validator**
- Validação declarativa via decorators
- Mensagens de erro customizáveis
- Integração nativa com NestJS
- Type-safety em tempo de compilação

### 5. **Testes Unitários**
- Mock completo do PrismaService
- Testes isolados e determinísticos
- Cobertura de todas as regras de negócio
- Documentação viva do comportamento esperado

### 6. **Transações**
- Uso de `$transaction` do Prisma
- Garante consistência em operações críticas
- Rollback automático em caso de erro

## 💼 Regras de Negócio

### Clientes
- CPF deve ser válido (validação matemática)
- CPF único no sistema
- Normalização automática do CPF

### Livros
- Livro criado com `disponivel = true`
- Campo `disponivel` controlado apenas pelo fluxo de reservas
- Livro indisponível não pode ser removido

### Reservas
- Cliente e livro devem existir
- Livro deve estar disponível
- Data de devolução deve ser posterior à data de reserva
- Livro fica indisponível ao criar reserva
- Livro volta a ficar disponível após devolução
- Não permite devolução duplicada

### Multas por Atraso
- Multa fixa: **R$ 10,00**
- Acréscimo: **5% por dia de atraso**
- Fórmula: `multaTotal = 10 + (10 × 0.05 × diasDeAtraso)`
- Dias arredondados para cima

## 🔒 Tratamento de Erros

O sistema utiliza exceções HTTP do NestJS:

- **400 Bad Request** - Dados inválidos (CPF inválido, datas inválidas)
- **404 Not Found** - Recurso não encontrado
- **409 Conflict** - Conflito de negócio (CPF duplicado, livro indisponível)

## 📝 Licença

Este projeto está sob a licença MIT.

---
