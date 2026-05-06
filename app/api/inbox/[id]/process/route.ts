import { addDays, startOfDay } from "date-fns";
import { ApiError, requireCurrentUser } from "@/lib/auth";
import { created, handleApiError } from "@/lib/http";
import { prisma } from "@/lib/prisma";
import { inboxProcessSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    const { id } = await context.params;
    const data = inboxProcessSchema.parse(await request.json());
    const item = await prisma.inboxItem.findFirst({ where: { id, userId: user.id } });

    if (!item) throw new ApiError("Inbox item not found.", 404);
    if (item.status !== "aberta") throw new ApiError("This item has already been processed.", 409);

    const result = await prisma.$transaction(async (tx) => {
      let createdRecord: unknown = null;

      if (data.action === "task") {
        createdRecord = await tx.task.create({
          data: {
            userId: user.id,
            title: item.title,
            description: item.content,
            status: "a_fazer",
            priority: "media",
            dueDate: startOfDay(new Date()),
            energy: "medio",
            isImportant: false,
            isUrgent: false
          }
        });
      }

      if (data.action === "project") {
        createdRecord = await tx.project.create({
          data: {
            userId: user.id,
            name: item.title,
            description: item.content,
            status: "ativo",
            startDate: startOfDay(new Date()),
            targetDate: addDays(startOfDay(new Date()), 14),
            color: "#1f9d72"
          }
        });
      }

      if (data.action === "note") {
        createdRecord = await tx.note.create({
          data: {
            userId: user.id,
            title: item.title,
            content: item.content || "",
            tags: ["inbox"]
          }
        });
      }

      const updatedItem = await tx.inboxItem.update({
        where: { id: item.id },
        data: {
          status: data.action === "discard" ? "descartada" : "processada",
          processedAt: new Date()
        }
      });

      return { item: updatedItem, created: createdRecord };
    });

    return created(result);
  } catch (error) {
    return handleApiError(error);
  }
}
