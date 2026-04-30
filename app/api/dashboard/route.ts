import { endOfDay, startOfDay } from "date-fns";
import { requireCurrentUser } from "@/lib/auth";
import { todayRange, weekRange } from "@/lib/date";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { projectWithProgress, taskInclude } from "@/lib/task-service";

function appliesToday(daysOfWeek: unknown, day: number) {
  if (!Array.isArray(daysOfWeek)) return true;
  return daysOfWeek.includes(day);
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const today = todayRange();
    const week = weekRange();
    const weekday = new Date().getDay();

    const [
      todayTasks,
      overdueTasks,
      upcomingTasks,
      activeHabits,
      goals,
      completedThisWeek,
      dueThisWeek,
      habitLogsThisWeek,
      projects
    ] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { gte: today.start, lte: today.end },
          status: { notIn: ["concluida", "cancelada"] }
        },
        orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
        include: taskInclude
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { lt: today.start },
          status: { notIn: ["concluida", "cancelada"] }
        },
        orderBy: { dueDate: "asc" },
        take: 8,
        include: taskInclude
      }),
      prisma.task.findMany({
        where: {
          userId: user.id,
          dueDate: { gt: today.end },
          status: { notIn: ["concluida", "cancelada"] }
        },
        orderBy: { dueDate: "asc" },
        take: 8,
        include: taskInclude
      }),
      prisma.habit.findMany({
        where: { userId: user.id, isActive: true },
        include: {
          logs: {
            where: { date: startOfDay(new Date()) }
          }
        },
        orderBy: { createdAt: "desc" }
      }),
      prisma.goal.findMany({
        where: { userId: user.id, status: "em_andamento" },
        orderBy: { dueDate: "asc" },
        take: 6
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          completedAt: { gte: week.start, lte: week.end },
          status: "concluida"
        }
      }),
      prisma.task.count({
        where: {
          userId: user.id,
          dueDate: { gte: week.start, lte: week.end }
        }
      }),
      prisma.habitLog.count({
        where: {
          userId: user.id,
          date: { gte: week.start, lte: endOfDay(week.end) },
          completed: true
        }
      }),
      projectWithProgress(user.id)
    ]);

    const habitsToday = activeHabits.filter((habit) => appliesToday(habit.daysOfWeek, weekday));
    const completedHabitsToday = habitsToday.filter((habit) => habit.logs.some((log) => log.completed)).length;

    return ok({
      todayTasks,
      overdueTasks,
      upcomingTasks,
      habitsToday,
      goals,
      projects: projects.slice(0, 5),
      stats: {
        completedThisWeek,
        completionRate: dueThisWeek === 0 ? 0 : Math.round((completedThisWeek / dueThisWeek) * 100),
        habitsDoneThisWeek: habitLogsThisWeek,
        habitsDoneToday: completedHabitsToday,
        goalsInProgress: goals.length
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
