import { addDays, startOfDay } from "date-fns";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("123456", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@focusflow.local" },
    update: { passwordHash, name: "Admin FocusFlow" },
    create: {
      email: "admin@focusflow.local",
      name: "Admin FocusFlow",
      passwordHash
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "seed-project-focusflow" },
    update: {},
    create: {
      id: "seed-project-focusflow",
      userId: user.id,
      name: "Organizacao pessoal",
      description: "Projeto inicial para configurar uma rotina semanal consistente.",
      status: "ativo",
      startDate: startOfDay(new Date()),
      targetDate: addDays(startOfDay(new Date()), 30),
      color: "#2081c3"
    }
  });

  const taskA = await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {},
    create: {
      id: "seed-task-1",
      userId: user.id,
      projectId: project.id,
      title: "Definir tres prioridades do dia",
      description: "Escolha o que realmente precisa acontecer hoje.",
      status: "a_fazer",
      priority: "alta",
      dueDate: startOfDay(new Date()),
      energy: "medio",
      estimatedMinutes: 20,
      isImportant: true,
      isUrgent: true
    }
  });

  await prisma.task.upsert({
    where: { id: "seed-task-2" },
    update: {},
    create: {
      id: "seed-task-2",
      userId: user.id,
      projectId: project.id,
      title: "Revisar pendencias da semana",
      status: "fazendo",
      priority: "media",
      dueDate: addDays(startOfDay(new Date()), 2),
      energy: "alto",
      estimatedMinutes: 45,
      isImportant: true,
      isUrgent: false
    }
  });

  await prisma.habit.upsert({
    where: { id: "seed-habit-1" },
    update: {},
    create: {
      id: "seed-habit-1",
      userId: user.id,
      name: "Planejar o dia",
      description: "Abrir o Meu Dia e ajustar as prioridades.",
      frequency: "diaria",
      daysOfWeek: [1, 2, 3, 4, 5],
      suggestedTime: "08:30"
    }
  });

  await prisma.goal.upsert({
    where: { id: "seed-goal-1" },
    update: {},
    create: {
      id: "seed-goal-1",
      userId: user.id,
      title: "Criar uma rotina sustentavel",
      description: "Manter planejamento, foco e revisao por quatro semanas.",
      category: "pessoal",
      startDate: startOfDay(new Date()),
      dueDate: addDays(startOfDay(new Date()), 28),
      progress: 25,
      status: "em_andamento"
    }
  });

  await prisma.inboxItem.upsert({
    where: { id: "seed-inbox-1" },
    update: {},
    create: {
      id: "seed-inbox-1",
      userId: user.id,
      type: "ideia",
      title: "Separar uma janela semanal para revisar metas",
      content: "Testar sexta-feira no fim da tarde."
    }
  });

  await prisma.note.upsert({
    where: { id: "seed-note-1" },
    update: {},
    create: {
      id: "seed-note-1",
      userId: user.id,
      title: "Sistema FocusFlow",
      content: "Use a Inbox para capturar, Tarefas para organizar e Revisao Semanal para ajustar.",
      tags: ["gtd", "rotina"]
    }
  });

  await prisma.$executeRaw`
    INSERT INTO daily_plans (id, user_id, date, reflection, created_at, updated_at)
    VALUES (${randomUUID()}, ${user.id}, CURDATE(), ${"Comece pequeno e proteja o foco."}, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE reflection = VALUES(reflection), updated_at = NOW(3)
  `;

  const [dailyPlan] = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM daily_plans WHERE user_id = ${user.id} AND date = CURDATE() LIMIT 1
  `;

  if (dailyPlan) {
    await prisma.dailyPlanTask.upsert({
      where: {
        dailyPlanId_taskId: {
          dailyPlanId: dailyPlan.id,
          taskId: taskA.id
        }
      },
      update: {
        isMainPriority: true,
        sortOrder: 0
      },
      create: {
        dailyPlanId: dailyPlan.id,
        taskId: taskA.id,
        isMainPriority: true,
        sortOrder: 0
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
