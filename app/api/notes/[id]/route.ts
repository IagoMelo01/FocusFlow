import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = noteSchema.partial().parse(await request.json());
    const existing = await prisma.note.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Note not found.", 404);

    const updateData: Prisma.NoteUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.tags !== undefined) updateData.tags = data.tags;

    const note = await prisma.note.update({ where: { id }, data: updateData });
    return ok({ note });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const existing = await prisma.note.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Note not found.", 404);

    await prisma.note.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
