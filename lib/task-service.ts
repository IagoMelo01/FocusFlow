import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function normalizeTagName(name: string) {
  return name.trim().replace(/^#/, "").toLowerCase();
}

export async function syncTaskTags(userId: string, taskId: string, tags: string[] | undefined) {
  if (!tags) return;

  const cleanTags = Array.from(new Set(tags.map(normalizeTagName).filter(Boolean)));

  await prisma.taskTag.deleteMany({ where: { taskId } });

  if (cleanTags.length === 0) return;

  for (const name of cleanTags) {
    const tag = await prisma.tag.upsert({
      where: { userId_name: { userId, name } },
      update: {},
      create: { userId, name }
    });

    await prisma.taskTag.create({
      data: { taskId, tagId: tag.id }
    });
  }
}

export const taskInclude = {
  project: true,
  tags: {
    include: {
      tag: true
    }
  },
  goals: {
    include: {
      goal: true
    }
  }
} satisfies Prisma.TaskInclude;

export function serializeTask<T extends { tags?: Array<{ tag: { name: string; color: string } }> }>(task: T) {
  return {
    ...task,
    tagNames: task.tags?.map((item) => item.tag.name) ?? []
  };
}

export async function projectWithProgress(userId: string) {
  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      tasks: {
        select: {
          id: true,
          status: true
        }
      }
    }
  });

  return projects.map((project) => {
    const total = project.tasks.length;
    const done = project.tasks.filter((task) => task.status === "concluida").length;
    return {
      ...project,
      progress: total === 0 ? 0 : Math.round((done / total) * 100),
      taskCount: total,
      completedTaskCount: done
    };
  });
}
