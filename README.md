# FocusFlow

FocusFlow is a personal productivity system built with Next.js, Node.js, Prisma, and MySQL. It combines methodologies such as GTD, personal Kanban, Eisenhower Matrix, daily/weekly planning, habit tracking, goals, notes, and Pomodoro-based focus sessions.

## Tech Stack

- Next.js (App Router) with TypeScript
- Internal API routes with Next.js
- Prisma ORM with MySQL
- Tailwind CSS
- Local authentication using bcrypt and HTTP-only JWT cookies
- Forms with React Hook Form
- Validation with Zod
- Charts with Recharts
- English UI by default with a Portuguese/English language selector

## Requirements

- Node.js 20+
- MySQL 8+
- Docker (optional, for running MySQL via `docker-compose.yml`)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Start MySQL

Using Docker:

```bash
docker compose up -d mysql
```

Or use a local MySQL instance:

```env
DATABASE_URL="mysql://focusflow:focusflow@localhost:3306/focusflow"
```

4. Run migrations:

```bash
npx prisma migrate dev
```

5. Seed the database:

```bash
npx prisma db seed
```

6. Start the application:

```bash
npm run dev
```

Access the app at: http://localhost:3000

## Test User

- Email: admin@focusflow.local  
- Password: 123456  

## Features

- Local authentication with isolated user data
- Language selector in the sidebar menu, persisted in the browser
- Dashboard with today's tasks, overdue items, upcoming tasks, habits, goals, and statistics
- Task CRUD with status, priority, due date, project, tags, energy, estimate, importance, and urgency
- Task views: list, Kanban, and Eisenhower Matrix
- Inbox for quick capture and processing into tasks, projects, notes, or discard
- Project CRUD with automatic progress based on completed tasks
- "My Day" view with task selection, priorities, and reflection
- Weekly review with planning and retrospective questions
- Habit tracking with daily logs, history, and streaks
- Goals with progress tracking and related tasks
- Pomodoro timer (25/5/15) with focus session tracking
- Markdown notes with tagging
- Real-time statistics using Recharts

## Project Structure

```text
app/
  api/                 Internal API routes
  (auth)/              Authentication (login/register)
  (app)/               Authenticated pages
components/
  layout/              Sidebar and application shell
  tasks/               Task forms
  ui/                  Base UI components
lib/                   Prisma, authentication, validation, helpers
prisma/
  schema.prisma        MySQL schema
  migrations/          Database migrations
  seed.ts              Seed data (test user and initial data)
```

## Local Validation

With MySQL running:

```bash
npx prisma validate
npx prisma migrate dev
npx prisma db seed
npm run build
npm run dev
```

## License

This project is licensed under the MIT License.
