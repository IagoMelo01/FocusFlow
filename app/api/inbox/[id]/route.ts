import { Prisma } from "@prisma/client";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { empty, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { inboxSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = inboxSchema.partial().parse(await request.json());

    const existing = await prisma.inboxItem.findFirst({ where: { id, userId: user.id } });
    if (!existing) throw new ApiError("Item da inbox nao encontrado.", 404);

    const updateData: Prisma.InboxItemUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content || null;
    if (data.type !== undefined) updateData.type = data.type;

    const item = await prisma.inboxItem.update({ where: { id }, data: updateData });
    return ok({ item });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const existing = await prisma.inboxItem.findFirst({ where: { id, userId: user.id } });

    if (!existing) throw new ApiError("Item da inbox nao encontrado.", 404);

    await prisma.inboxItem.delete({ where: { id } });
    return empty();
  } catch (error) {
    return handleApiError(error);
  }
}
