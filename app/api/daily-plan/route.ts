import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { dateOnly, todayRange } from "@/lib/date";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { taskInclude } from "@/lib/task-service";
import { dailyPlanSchema } from "@/lib/validations";

function nextDay(date: Date) {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

async function loadDailyPlan(userId: string, date: Date) {
  const plan = await prisma.dailyPlan.findUnique({
    where: { userId_date: { userId, date } },
    include: {
      tasks: {
        orderBy: { sortOrder: "asc" },
        include: {
          task: {
            include: taskInclude
          }
        }
      }
    }
  });

  const dueToday = await prisma.task.findMany({
    where: {
      userId,
      dueDate: { gte: date, lt: nextDay(date) },
      status: { notIn: ["concluida", "cancelada"] }
    },
    orderBy: { dueDate: "asc" },
    include: taskInclude
  });

  const overdue = await prisma.task.findMany({
    where: {
      userId,
      dueDate: { lt: date },
      status: { notIn: ["concluida", "cancelada"] }
    },
    orderBy: { dueDate: "asc" },
    include: taskInclude
  });

  const availableTasks = await prisma.task.findMany({
    where: {
      userId,
      status: { notIn: ["concluida", "cancelada"] }
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 80,
    include: taskInclude
  });

  return { plan, dueToday, overdue, availableTasks };
}

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const date = dateOnly(searchParams.get("date"));
    const today = todayRange();

    return ok({
      date,
      isToday: date.getTime() === today.start.getTime(),
      ...(await loadDailyPlan(user.id, date))
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = dailyPlanSchema.parse(await request.json());
    const date = dateOnly(data.date);
    const mainPriorityIds = new Set(data.mainPriorityTaskIds);

    if (mainPriorityIds.size > 3) {
      throw new ApiError("Choose up to 3 main priorities.", 422);
    }

    const ownedTasks = await prisma.task.findMany({
      where: {
        id: { in: data.taskIds },
        userId: user.id
      },
      select: { id: true }
    });
    const ownedTaskIds = ownedTasks.map((task) => task.id);

    const plan = await prisma.$transaction(async (tx) => {
      const upserted = await tx.dailyPlan.upsert({
        where: { userId_date: { userId: user.id, date } },
        update: { reflection: data.reflection || null },
        create: {
          userId: user.id,
          date,
          reflection: data.reflection || null
        }
      });

      await tx.dailyPlanTask.deleteMany({ where: { dailyPlanId: upserted.id } });

      if (ownedTaskIds.length > 0) {
        await tx.dailyPlanTask.createMany({
          data: ownedTaskIds.map((taskId, index) => ({
            dailyPlanId: upserted.id,
            taskId,
            isMainPriority: mainPriorityIds.has(taskId),
            sortOrder: index
          }))
        });
      }

      return tx.dailyPlan.findUniqueOrThrow({
        where: { id: upserted.id },
        include: {
          tasks: {
            orderBy: { sortOrder: "asc" },
            include: {
              task: {
                include: taskInclude as Prisma.TaskInclude
              }
            }
          }
        }
      });
    });

    return ok({ plan });
  } catch (error) {
    return handleApiError(error);
  }
}
