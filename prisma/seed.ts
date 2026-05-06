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
    update: {
      name: "Personal organization",
      description: "Initial project to set up a consistent weekly routine."
    },
    create: {
      id: "seed-project-focusflow",
      userId: user.id,
      name: "Personal organization",
      description: "Initial project to set up a consistent weekly routine.",
      status: "ativo",
      startDate: startOfDay(new Date()),
      targetDate: addDays(startOfDay(new Date()), 30),
      color: "#2081c3"
    }
  });

  const taskA = await prisma.task.upsert({
    where: { id: "seed-task-1" },
    update: {
      title: "Define the top three priorities for the day",
      description: "Choose what really needs to happen today."
    },
    create: {
      id: "seed-task-1",
      userId: user.id,
      projectId: project.id,
      title: "Define the top three priorities for the day",
      description: "Choose what really needs to happen today.",
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
    update: {
      title: "Review weekly pending items"
    },
    create: {
      id: "seed-task-2",
      userId: user.id,
      projectId: project.id,
      title: "Review weekly pending items",
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
    update: {
      name: "Plan the day",
      description: "Open My Day and adjust priorities."
    },
    create: {
      id: "seed-habit-1",
      userId: user.id,
      name: "Plan the day",
      description: "Open My Day and adjust priorities.",
      frequency: "diaria",
      daysOfWeek: [1, 2, 3, 4, 5],
      suggestedTime: "08:30"
    }
  });

  await prisma.goal.upsert({
    where: { id: "seed-goal-1" },
    update: {
      title: "Build a sustainable routine",
      description: "Keep planning, focus and review for four weeks."
    },
    create: {
      id: "seed-goal-1",
      userId: user.id,
      title: "Build a sustainable routine",
      description: "Keep planning, focus and review for four weeks.",
      category: "pessoal",
      startDate: startOfDay(new Date()),
      dueDate: addDays(startOfDay(new Date()), 28),
      progress: 25,
      status: "em_andamento"
    }
  });

  await prisma.inboxItem.upsert({
    where: { id: "seed-inbox-1" },
    update: {
      title: "Set a weekly window to review goals",
      content: "Try Friday late afternoon."
    },
    create: {
      id: "seed-inbox-1",
      userId: user.id,
      type: "ideia",
      title: "Set a weekly window to review goals",
      content: "Try Friday late afternoon."
    }
  });

  await prisma.note.upsert({
    where: { id: "seed-note-1" },
    update: {
      title: "FocusFlow system",
      content: "Use Inbox to capture, Tasks to organize and Weekly Review to adjust."
    },
    create: {
      id: "seed-note-1",
      userId: user.id,
      title: "FocusFlow system",
      content: "Use Inbox to capture, Tasks to organize and Weekly Review to adjust.",
      tags: ["gtd", "routine"]
    }
  });

  await prisma.$executeRaw`
    INSERT INTO daily_plans (id, user_id, date, reflection, created_at, updated_at)
    VALUES (${randomUUID()}, ${user.id}, CURDATE(), ${"Start small and protect your focus."}, NOW(3), NOW(3))
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
