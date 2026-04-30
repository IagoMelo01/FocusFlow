# FocusFlow

FocusFlow e um sistema de produtividade pessoal em Next.js, Node.js, Prisma e MySQL. Ele combina GTD, Kanban pessoal, Matriz de Eisenhower, planejamento diario/semanal, controle de habitos, metas, notas e foco Pomodoro.

## Stack

- Next.js App Router com TypeScript
- APIs internas no Next.js
- Prisma ORM com MySQL
- Tailwind CSS
- Autenticacao local com bcrypt e JWT em cookie HTTP-only
- Formularios com React Hook Form
- Validacao com Zod
- Graficos com Recharts

## Requisitos

- Node.js 20+
- MySQL 8+
- Docker opcional para subir MySQL usando `docker-compose.yml`

## Configuracao

1. Instale dependencias:

```bash
npm install
```

2. Configure ambiente:

```bash
cp .env.example .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Suba o MySQL.

Com Docker:

```bash
docker compose up -d mysql
```

Ou use um MySQL local com a URL:

```env
DATABASE_URL="mysql://focusflow:focusflow@localhost:3306/focusflow"
```

4. Aplique migrations:

```bash
npx prisma migrate dev
```

5. Rode o seed:

```bash
npx prisma db seed
```

6. Inicie em localhost:

```bash
npm run dev
```

Acesse `http://localhost:3000`.

## Usuario de teste

- E-mail: `admin@focusflow.local`
- Senha: `123456`

## Funcionalidades

- Login e cadastro locais com dados isolados por usuario
- Dashboard com tarefas de hoje, atrasadas, proximas, habitos, metas e estatisticas
- CRUD de tarefas com status, prioridade, vencimento, projeto, tags, energia, estimativa, importancia e urgencia
- Visualizacao de tarefas em lista, Kanban e Matriz de Eisenhower
- Inbox para captura rapida e processamento em tarefa, projeto, nota ou descarte
- CRUD de projetos com progresso automatico por tarefas concluidas
- Meu Dia com selecao de tarefas, atrasadas, vencendo hoje, top 3 prioridades e reflexao
- Revisao Semanal com tarefas de segunda a domingo, metas da semana e perguntas de retrospectiva
- CRUD de habitos, marcacao diaria, historico e streak
- CRUD de metas com progresso e tarefas relacionadas
- Pomodoro com 25/5/15 minutos e registro de sessoes de foco
- Notas em markdown simples com tags
- Estatisticas reais com Recharts

## Estrutura

```text
app/
  api/                 Rotas de API internas
  (auth)/              Login e cadastro
  (app)/               Telas autenticadas
components/
  layout/              Sidebar e shell autenticado
  tasks/               Formulario de tarefas
  ui/                  Componentes base
lib/                   Prisma, auth, validacoes e helpers
prisma/
  schema.prisma        Modelo MySQL
  migrations/          Migration inicial
  seed.ts              Usuario e dados de teste
```

## Validacao local

Com o MySQL ativo:

```bash
npx prisma validate
npx prisma migrate dev
npx prisma db seed
npm run build
npm run dev
```
