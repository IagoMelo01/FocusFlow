import { ApiError, requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { focusSessionSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const sessions = await prisma.focusSession.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 100,
      include: {
        task: true
      }
    });

    return ok({ sessions });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = focusSessionSchema.parse(await request.json());

    if (data.taskId) {
      const task = await prisma.task.findFirst({
        where: { id: data.taskId, userId: user.id },
        select: { id: true }
      });
      if (!task) throw new ApiError("Task not found.", 404);
    }

    const session = await prisma.focusSession.create({
      data: {
        userId: user.id,
        taskId: data.taskId || null,
        startedAt: parseDateInput(data.startedAt) ?? new Date(),
        endedAt: parseDateInput(data.endedAt),
        durationMinutes: data.durationMinutes,
        status: data.status
      },
      include: { task: true }
    });

    return created({ session });
  } catch (error) {
    return handleApiError(error);
  }
}
