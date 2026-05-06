import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { parseDateInput } from "@/lib/date";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = projectSchema.partial().parse(await request.json());
    const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Project not found.", 404);

    const updateData: Prisma.ProjectUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = parseDateInput(data.startDate);
    if (data.targetDate !== undefined) updateData.targetDate = parseDateInput(data.targetDate);
    if (data.color !== undefined) updateData.color = data.color;

    const project = await prisma.project.update({ where: { id }, data: updateData });
    return ok({ project });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const existing = await prisma.project.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Project not found.", 404);

    await prisma.project.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
