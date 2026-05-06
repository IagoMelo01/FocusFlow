import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { habitSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = habitSchema.partial().parse(await request.json());
    const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Habit not found.", 404);

    const updateData: Prisma.HabitUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;
    if (data.suggestedTime !== undefined) updateData.suggestedTime = data.suggestedTime || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const habit = await prisma.habit.update({ where: { id }, data: updateData });
    return ok({ habit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const existing = await prisma.habit.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Habit not found.", 404);

    await prisma.habit.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
