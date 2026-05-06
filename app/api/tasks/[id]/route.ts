import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { serializeTask, syncTaskTags, taskInclude } from "@/lib/task-service";
import { taskPatchSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = taskPatchSchema.parse(await request.json());

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) throw new ApiError("Task not found.", 404);

    const updateData: Prisma.TaskUpdateInput = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.status !== undefined) {
      updateData.status = data.status;
      updateData.completedAt = data.status === "concluida" ? existing.completedAt ?? new Date() : null;
    }
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.dueDate !== undefined) updateData.dueDate = parseDateInput(data.dueDate);
    if (data.projectId !== undefined) {
      if (data.projectId) {
        const project = await prisma.project.findFirst({
          where: { id: data.projectId, userId: user.id },
          select: { id: true }
        });
        if (!project) throw new ApiError("Project not found.", 404);
        updateData.project = { connect: { id: data.projectId } };
      } else {
        updateData.project = { disconnect: true };
      }
    }
    if (data.energy !== undefined) updateData.energy = data.energy;
    if (data.estimatedMinutes !== undefined) updateData.estimatedMinutes = data.estimatedMinutes || null;
    if (data.isImportant !== undefined) updateData.isImportant = data.isImportant;
    if (data.isUrgent !== undefined) updateData.isUrgent = data.isUrgent;
    if (data.completedAt !== undefined) updateData.completedAt = parseDateInput(data.completedAt);

    await prisma.task.update({
      where: { id },
      data: updateData
    });

    await syncTaskTags(user.id, id, data.tags);

    const task = await prisma.task.findUniqueOrThrow({
      where: { id },
      include: taskInclude
    });

    return ok({ task: serializeTask(task) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;

    const existing = await prisma.task.findFirst({
      where: { id, userId: user.id }
    });

    if (!existing) throw new ApiError("Task not found.", 404);

    await prisma.task.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
