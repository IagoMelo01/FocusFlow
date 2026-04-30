import { requireCurrentUser } from "@/lib/auth";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { inboxSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const items = await prisma.inboxItem.findMany({
      where: { userId: user.id },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }]
    });

    return ok({ items });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = inboxSchema.parse(await request.json());
    const item = await prisma.inboxItem.create({
      data: {
        userId: user.id,
        type: data.type,
        title: data.title,
        content: data.content || null
      }
    });

    return created({ item });
  } catch (error) {
    return handleApiError(error);
  }
}
