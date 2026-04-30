import { requireCurrentUser } from "@/lib/auth";
import { created, handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { habitSchema } from "@/lib/validations";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const habits = await prisma.habit.findMany({
      where: { userId: user.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      include: {
        logs: {
          orderBy: { date: "desc" },
          take: 60
        }
      }
    });

    return ok({ habits });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = habitSchema.parse(await request.json());
    const habit = await prisma.habit.create({
      data: {
        userId: user.id,
        name: data.name,
        description: data.description || null,
        frequency: data.frequency,
        daysOfWeek: data.daysOfWeek,
        suggestedTime: data.suggestedTime || null,
        isActive: data.isActive
      }
    });

    return created({ habit });
  } catch (error) {
    return handleApiError(error);
  }
}
