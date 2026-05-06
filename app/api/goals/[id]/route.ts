import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { goalSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = goalSchema.partial().parse(await request.json());
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Goal not found.", 404);

    const updateData: Prisma.GoalUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.startDate !== undefined) updateData.startDate = parseDateInput(data.startDate);
    if (data.dueDate !== undefined) updateData.dueDate = parseDateInput(data.dueDate);
    if (data.progress !== undefined) updateData.progress = data.progress;
    if (data.status !== undefined) updateData.status = data.status;

    await prisma.goal.update({ where: { id }, data: updateData });

    if (data.taskIds) {
      const ownedTasks = await prisma.task.findMany({
        where: { userId: user.id, id: { in: data.taskIds } },
        select: { id: true }
      });
      await prisma.goalTask.deleteMany({ where: { goalId: id } });
      if (ownedTasks.length > 0) {
        await prisma.goalTask.createMany({
          data: ownedTasks.map((task) => ({ goalId: id, taskId: task.id }))
        });
      }
    }

    const goal = await prisma.goal.findUniqueOrThrow({
      where: { id },
      include: { tasks: { include: { task: true } } }
    });
    return ok({ goal });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const existing = await prisma.goal.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Goal not found.", 404);

    await prisma.goal.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
