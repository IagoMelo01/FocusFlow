import { differenceInCalendarDays, startOfDay, subDays } from "date-fns";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { dateOnly } from "@/lib/date";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { habitLogSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function recalculateDailyStreak(habitId: string) {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, completed: true },
    orderBy: { date: "desc" },
    select: { date: true }
  });

  const completedDays = new Set(logs.map((log) => startOfDay(log.date).getTime()));
  let cursor = startOfDay(new Date());
  let current = 0;

  while (completedDays.has(cursor.getTime())) {
    current += 1;
    cursor = subDays(cursor, 1);
  }

  let best = 0;
  let run = 0;
  let previous: Date | null = null;

  for (const log of [...logs].reverse()) {
    const currentDate = startOfDay(log.date);
    if (!previous || differenceInCalendarDays(currentDate, previous) === 1) {
      run += 1;
    } else {
      best = Math.max(best, run);
      run = 1;
    }
    previous = currentDate;
  }

  best = Math.max(best, run, current);

  return prisma.habit.update({
    where: { id: habitId },
    data: {
      streakCurrent: current,
      streakBest: best
    },
    include: {
      logs: {
        orderBy: { date: "desc" },
        take: 60
      }
    }
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = habitLogSchema.parse(await request.json());
    const date = dateOnly(data.date);
    const habit = await prisma.habit.findFirst({ where: { id, userId: user.id } });

    if (!habit) throw new ApiError("Habito nao encontrado.", 404);

    if (data.completed) {
      await prisma.habitLog.upsert({
        where: { habitId_date: { habitId: id, date } },
        update: { completed: true },
        create: {
          habitId: id,
          userId: user.id,
          date,
          completed: true
        }
      });
    } else {
      await prisma.habitLog.deleteMany({
        where: {
          habitId: id,
          userId: user.id,
          date
        }
      });
    }

    return ok({ habit: await recalculateDailyStreak(id) });
  } catch (error) {
    return handleApiError(error);
  }
}
