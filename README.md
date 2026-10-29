# Biblioteca — evolução SaaS, fase 02

Tópicos Especiais em Engenharia de Software II · Ifes 2026.2

A branch `saas-evolution/fase02` parte da `saas-evolution/fase01`, que implementou a
[aula de PostgreSQL, Docker e React](.docs/saas-evolution/saas-fase01.html)
e os 23 casos de uso da turma. O monólito modular usa PostgreSQL 18 e uma
interface React 19 com acervo, autores, leitores, exemplares, reservas e empréstimos.

## Executar a aplicação

Com Docker Desktop aberto, na raiz do projeto:

```bash
docker compose -f infra/compose.yaml up -d --build
```

Abra <http://localhost:3000>. O `infra/Dockerfile` compila o frontend, e o backend serve
a interface e a API no mesmo endereço. O PostgreSQL atende somente na rede do
Compose, sem publicar a porta 5432. Os dados ficam no volume `pgdata`.

Para parar e preservar os dados:

```bash
docker compose -f infra/compose.yaml down
```

## Testes e verificações

Na primeira execução, crie o banco exclusivo da suíte, com o serviço `db` no ar:

```bash
docker compose -f infra/compose.yaml exec db createdb -U biblioteca biblioteca_test
```

Execute a suíte completa dentro da rede do Docker:

```bash
docker compose -f infra/compose.yaml run --rm --build test
```

Os testes de integração usam `biblioteca_test`; a aplicação usa `biblioteca`.
Se remover o volume com `docker compose -f infra/compose.yaml down -v`, crie novamente o banco de testes.

As verificações que dispensam PostgreSQL podem rodar localmente com Bun 1.4 ou
mais novo. Em `backend/`:

```bash
bun install --frozen-lockfile
bun run typecheck
bun run verificar
bun test tests/cadastrar-livro.test.ts
```

## Desenvolver o frontend

Mantenha a aplicação no Docker. Em `frontend/`:

```bash
bun install --frozen-lockfile
bun run dev
```

Abra <http://localhost:5173>. O proxy do Vite encaminha `/api` para a aplicação
na porta 3000. O menu agrupa as páginas por área:

| Área | Páginas |
|---|---|
| Livros | `/livros`, `/livros/cadastrar`, `/livros/editar`, `/livros/excluir`, `/livros/seed` |
| Autores | `/autores`, `/autores/cadastrar`, `/autores/editar`, `/autores/excluir` |
| Leitores | `/leitores`, `/leitores/cadastrar`, `/leitores/editar`, `/leitores/excluir` |
| Exemplares | `/exemplares`, `/exemplares/cadastrar`, `/exemplares/editar`, `/exemplares/excluir` |
| Reservas | `/reservas`, `/reservas/criar`, `/reservas/cancelar` |
| Empréstimos | `/emprestimos`, `/emprestimos/registrar`, `/emprestimos/devolver` |

Os endereços antigos `/` e `/cadastrar` redirecionam para `/livros` e
`/livros/cadastrar`.

Para validar o frontend:

```bash
bun run lint
bun run build
```

Após alterações no backend, recrie o serviço com
`docker compose -f infra/compose.yaml up -d --build app`. Para atualizar também a interface servida
pela porta 3000, refaça esse build depois de alterar o frontend.

## API e carga inicial

Todas as rotas ficam sob `/api`; `GET /api` identifica a API.

| Recurso | Consultar | Cadastrar ou agir | Atualizar | Excluir |
|---|---|---|---|---|
| Livros | `GET /livros?q=`, `GET /livros/id/:id` | `POST /livros` | `PUT /livros/:id` | `DELETE /livros/:id` |
| Autores | `GET /autores?q=`, `GET /autores/:id` | `POST /autores` | `PUT /autores/:id` | `DELETE /autores/:id` |
| Leitores | `GET /leitores?q=`, `GET /leitores/:id` | `POST /leitores` | `PUT /leitores/:id` | `DELETE /leitores/:id` |
| Exemplares | `GET /exemplares?q=&livroId=&situacao=`, `GET /exemplares/:id` | `POST /exemplares` | `PUT /exemplares/:id` | `DELETE /exemplares/:id` |
| Reservas | `GET /reservas?leitorId=&exemplarId=&situacao=`, `GET /reservas/:id` | `POST /reservas`, `POST /reservas/:id/cancelamento` | — | — |
| Empréstimos | `GET /emprestimos?leitorId=&exemplarId=&situacao=`, `GET /emprestimos/:id` | `POST /emprestimos`, `POST /emprestimos/:id/devolucao` | — | — |
| Seed | `GET /seed` | `POST /seed` | — | — |

A busca legada `GET /api/livros/:q` continua disponível. O cadastro de livro
recebe `isbn`, `titulo` e `autorId`; o de exemplar recebe `livroId`, `localizacao`
e `estadoConservacao`. Os autores da carga inicial são 1 — Eric Evans,
2 — Robert C. Martin, 3 — Harper Lee e 4 — Jane Austen.

## Estrutura e tutorial original

- `backend/`: aplicação Bun/Hono, módulos Acervo, Autoria, Leitores e Circulação, seed, testes e verificador de fronteiras.
- `frontend/`: React, React Router, Vite e CSS.
- `infra/`: Compose, Dockerfile e `Dockerfile.dockerignore`.
- `.docs/saas-evolution/`: aulas da evolução SaaS.

O tutorial original do monólito modular está nas branches
`modular-monolith/fase01` a `modular-monolith/fase53`.

O Compose usa a raiz do repositório como contexto de build para incluir
`backend/` e `frontend/`. O ignore específico `infra/Dockerfile.dockerignore`
filtra esse contexto. O nome do projeto continua sendo `biblioteca-tutorial`.

## Casos de uso da fase 01

Os 23 casos de uso foram implementados pela turma em `saas-evolution/fase01`.
Os tutoriais, o painel de andamento e o script de preparação das atividades
continuam disponíveis nessa branch, em `.docs/use-cases/`.

Cada caso registra sua API em `backend/src/use-cases/ucNN.ts` e sua tela em
`frontend/src/use-cases/ucNN.tsx`, com testes em `backend/tests/ucNN.test.ts`.
Somente `maroquio` pode atualizar ou integrar PRs nas branches centrais.

O UC23 implementa um seed manual e idempotente. Abra
`/livros/seed` ou execute `docker compose -f infra/compose.yaml exec -T app bun src/seed.ts`.
O catálogo tem fontes bibliográficas; os leitores são fictícios.
