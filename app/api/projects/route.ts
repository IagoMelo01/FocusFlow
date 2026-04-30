import { requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { projectWithProgress } from "@/lib/task-service";
import { projectSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    return ok({ projects: await projectWithProgress(user.id) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = projectSchema.parse(await request.json());

    const project = await prisma.project.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        status: data.status,
        startDate: parseDateInput(data.startDate),
        targetDate: parseDateInput(data.targetDate),
        color: data.color
      }
    });

    return created({ project });
  } catch (error) {
    return handleApiError(error);
  }
}
