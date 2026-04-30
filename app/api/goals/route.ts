import { requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations";

async function loadGoals(userId: string) {
  const goals = await prisma.goal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    include: {
      tasks: {
        include: {
          task: true
        }
      }
    }
  });

  return goals.map((goal) => {
    const total = goal.tasks.length;
    const completed = goal.tasks.filter((item) => item.task.status === "concluida").length;
    return {
      ...goal,
      relatedTaskCount: total,
      relatedTaskProgress: total === 0 ? goal.progress : Math.round((completed / total) * 100)
    };
  });
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return ok({ goals: await loadGoals(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = goalSchema.parse(await request.json());
    const ownedTasks = await prisma.task.findMany({
      where: { userId: user.id, id: { in: data.taskIds } },
      select: { id: true }
    });

    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        title: data.title,
        description: data.description || null,
        category: data.category,
        startDate: parseDateInput(data.startDate),
        dueDate: parseDateInput(data.dueDate),
        progress: data.progress,
        status: data.status,
        tasks: {
          create: ownedTasks.map((task) => ({ taskId: task.id }))
        }
      }
    });

    return created({ goal });
  } catch (error) {
    return handleApiError(error);
  }
}
