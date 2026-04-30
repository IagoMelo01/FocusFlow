import { addDays, endOfDay, startOfDay } from "date-fns";
import { requireCurrentUser } from "@/lib/auth";
import { dateOnly, weekRange } from "@/lib/date";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { taskInclude } from "@/lib/task-service";
import { weeklyReviewSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("weekStart") ? dateOnly(searchParams.get("weekStart")) : new Date();
    const { start, end } = weekRange(base);

    const [review, tasks] = await Promise.all([
      prisma.weeklyReview.findUnique({
        where: {
          userId_weekStart: {
            userId: user.id,
            weekStart: start
          }
        }
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { gte: start, lte: end }
        },
        orderBy: [{ dueDate: "asc" }, { status: "asc" }],
        include: taskInclude
      })
    ]);

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = startOfDay(addDays(start, index));
      const dayEnd = endOfDay(day);
      return {
        date: day,
        tasks: tasks.filter((task) => task.dueDate && task.dueDate >= day && task.dueDate <= dayEnd)
      };
    });

    return ok({ weekStart: start, weekEnd: end, review, days });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const data = weeklyReviewSchema.parse(await request.json());
    const { start, end } = weekRange(dateOnly(data.weekStart));

    const review = await prisma.weeklyReview.upsert({
      where: {
        userId_weekStart: {
          userId: user.id,
          weekStart: start
        }
      },
      update: {
        weekEnd: end,
        weeklyGoals: data.weeklyGoals || null,
        completed: data.completed || null,
        pending: data.pending || null,
        blockers: data.blockers || null,
        improvements: data.improvements || null
      },
      create: {
        userId: user.id,
        weekStart: start,
        weekEnd: end,
        weeklyGoals: data.weeklyGoals || null,
        completed: data.completed || null,
        pending: data.pending || null,
        blockers: data.blockers || null,
        improvements: data.improvements || null
      }
    });

    return ok({ review });
  } catch (error) {
    return handleApiError(error);
  }
}
