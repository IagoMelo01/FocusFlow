import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { dateOnly, parseDateInput, todayRange } from "@/lib/date";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { serializeTask, syncTaskTags, taskInclude } from "@/lib/task-service";
import { taskSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const today = todayRange();
    const where: Prisma.TaskWhereInput = { userId: user.id };

    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const projectId = searchParams.get("projectId");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const due = searchParams.get("due");
    const date = searchParams.get("date");

    if (status) where.status = status as Prisma.EnumTaskStatusFilter["equals"];
    if (priority) where.priority = priority as Prisma.EnumTaskPriorityFilter["equals"];
    if (projectId) where.projectId = projectId;
    if (tag) where.tags = { some: { tag: { name: tag } } };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    if (due === "today") {
      where.dueDate = { gte: today.start, lte: today.end };
    }

    if (due === "overdue") {
      where.dueDate = { lt: today.start };
      where.status = { notIn: ["concluida", "cancelada"] };
    }

    if (due === "upcoming") {
      where.dueDate = { gt: today.end };
      where.status = { notIn: ["concluida", "cancelada"] };
    }

    if (date) {
      const selectedDate = dateOnly(date);
      where.dueDate = {
        gte: selectedDate,
        lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { dueDate: "asc" },
        { priority: "desc" },
        { createdAt: "desc" }
      ],
      include: taskInclude
    });

    return ok({
      tasks: tasks.map(serializeTask),
      generatedAt: now
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = taskSchema.parse(await request.json());
    const dueDate = parseDateInput(data.dueDate);

    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, userId: user.id },
        select: { id: true }
      });
      if (!project) throw new ApiError("Project not found.", 404);
    }

    const task = await prisma.task.create({
      data: {
        userId: user.id,
        projectId: data.projectId || null,
        title: data.title,
        description: data.description || null,
        status: data.status,
        priority: data.priority,
        dueDate,
        completedAt: data.status === "concluida" ? new Date() : null,
        energy: data.energy,
        estimatedMinutes: data.estimatedMinutes || null,
        isImportant: data.isImportant,
        isUrgent: data.isUrgent
      },
      include: taskInclude
    });

    await syncTaskTags(user.id, task.id, data.tags);

    const fresh = await prisma.task.findUniqueOrThrow({
      where: { id: task.id },
      include: taskInclude
    });

    return created({ task: serializeTask(fresh) });
  } catch (error) {
    return handleApiError(error);
  }
}
