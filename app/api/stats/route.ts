import { addDays, format, startOfDay } from "date-fns";
import { requireCurrentUser } from "@/lib/auth";
import { weekRange } from "@/lib/date";
import { handleApiError, ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { projectWithProgress } from "@/lib/task-service";

export async function GET() {
  try {
    const user = await requireCurrentUser();
    const week = weekRange();
    const days = Array.from({ length: 7 }, (_, index) => startOfDay(addDays(week.start, index)));
    const [completedTasks, tasksByPriority, habitLogs, focusSessions, projects] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId: user.id,
          status: "concluida",
          completedAt: { gte: week.start, lte: week.end }
        },
        select: {
          completedAt: true
        }
      }),
      prisma.task.groupBy({
        by: ["priority"],
        where: { userId: user.id },
        _count: true
      }),
      prisma.habitLog.findMany({
        where: {
          userId: user.id,
          date: { gte: week.start, lte: week.end },
          completed: true
        },
        select: { date: true }
      }),
      prisma.focusSession.findMany({
        where: {
          userId: user.id,
          startedAt: { gte: week.start, lte: week.end }
        },
        select: {
          startedAt: true,
          durationMinutes: true,
          status: true
        }
      }),
      projectWithProgress(user.id)
    ]);

    const tasksCompletedByDay = days.map((day) => ({
      day: format(day, "dd/MM"),
      concluidas: completedTasks.filter((task) => task.completedAt && startOfDay(task.completedAt).getTime() === day.getTime()).length
    }));

    const habitsByDay = days.map((day) => ({
      day: format(day, "dd/MM"),
      feitos: habitLogs.filter((log) => startOfDay(log.date).getTime() === day.getTime()).length
    }));

    const focusByDay = days.map((day) => ({
      day: format(day, "dd/MM"),
      minutos: focusSessions
        .filter((session) => startOfDay(session.startedAt).getTime() === day.getTime())
        .reduce((sum, session) => sum + session.durationMinutes, 0)
    }));

    return ok({
      tasksCompletedByDay,
      tasksByPriority: tasksByPriority.map((item) => ({
        priority: item.priority,
        total: item._count
      })),
      habitsByDay,
      focusByDay,
      focusTotalMinutes: focusSessions.reduce((sum, session) => sum + session.durationMinutes, 0),
      productivityWeekly: days.map((day) => {
        const completed = completedTasks.filter((task) => task.completedAt && startOfDay(task.completedAt).getTime() === day.getTime()).length;
        const focus = focusSessions
          .filter((session) => startOfDay(session.startedAt).getTime() === day.getTime())
          .reduce((sum, session) => sum + session.durationMinutes, 0);
        return {
          day: format(day, "dd/MM"),
          score: completed * 10 + Math.round(focus / 10)
        };
      }),
      projects: projects
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 8)
        .map((project) => ({
          name: project.name,
          progresso: project.progress
        }))
    });
  } catch (error) {
    return handleApiError(error);
  }
}
