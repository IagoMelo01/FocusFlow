import { requireCurrentUser } from "@/lib/auth";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { noteSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { content: { contains: search } }
              ]
            }
          : {})
      },
      orderBy: { updatedAt: "desc" }
    });

    return ok({ notes });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = noteSchema.parse(await request.json());
    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: data.title,
        content: data.content,
        tags: data.tags
      }
    });

    return created({ note });
  } catch (error) {
    return handleApiError(error);
  }
}
