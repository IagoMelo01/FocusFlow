import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(1, "Informe a senha.")
});

export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Informe seu nome.").optional().or(z.literal(""))
});

export const taskSchema = z.object({
  title: z.string().trim().min(2, "Informe um titulo."),
  description: z.string().optional().nullable(),
  status: z.enum(["inbox", "a_fazer", "fazendo", "aguardando", "concluida", "cancelada"]).default("a_fazer"),
  priority: z.enum(["baixa", "media", "alta", "urgente"]).default("media"),
  dueDate: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  tags: z.array(z.string()).default([]),
  energy: z.enum(["baixo", "medio", "alto"]).default("medio"),
  estimatedMinutes: z.coerce.number().int().positive().optional().nullable(),
  isImportant: z.coerce.boolean().default(false),
  isUrgent: z.coerce.boolean().default(false)
});

export const taskPatchSchema = taskSchema.partial().extend({
  completedAt: z.string().optional().nullable()
});

export const projectSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  description: z.string().optional().nullable(),
  status: z.enum(["ativo", "pausado", "concluido", "cancelado"]).default("ativo"),
  startDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  color: z.string().default("#2081c3")
});

export const inboxSchema = z.object({
  type: z.enum(["tarefa", "ideia", "lembrete", "anotacao"]).default("tarefa"),
  title: z.string().trim().min(2, "Informe um titulo."),
  content: z.string().optional().nullable()
});

export const inboxProcessSchema = z.object({
  action: z.enum(["task", "project", "note", "discard"])
});

export const habitSchema = z.object({
  name: z.string().trim().min(2, "Informe um nome."),
  description: z.string().optional().nullable(),
  frequency: z.enum(["diaria", "semanal"]).default("diaria"),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([1, 2, 3, 4, 5]),
  suggestedTime: z.string().optional().nullable(),
  isActive: z.coerce.boolean().default(true)
});

export const habitLogSchema = z.object({
  date: z.string().optional(),
  completed: z.coerce.boolean().default(true)
});

export const goalSchema = z.object({
  title: z.string().trim().min(2, "Informe um titulo."),
  description: z.string().optional().nullable(),
  category: z.enum(["saude", "carreira", "estudos", "financeiro", "pessoal", "outro"]).default("outro"),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  status: z.enum(["em_andamento", "concluida", "pausada", "cancelada"]).default("em_andamento"),
  taskIds: z.array(z.string()).default([])
});

export const noteSchema = z.object({
  title: z.string().trim().min(2, "Informe um titulo."),
  content: z.string().default(""),
  tags: z.array(z.string()).default([])
});

export const focusSessionSchema = z.object({
  taskId: z.string().optional().nullable(),
  startedAt: z.string(),
  endedAt: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1),
  status: z.enum(["concluida", "interrompida"]).default("concluida")
});

export const dailyPlanSchema = z.object({
  date: z.string(),
  reflection: z.string().optional().nullable(),
  taskIds: z.array(z.string()).default([]),
  mainPriorityTaskIds: z.array(z.string()).max(3, "Escolha no maximo 3 prioridades.").default([])
});

export const weeklyReviewSchema = z.object({
  weekStart: z.string(),
  weeklyGoals: z.string().optional().nullable(),
  completed: z.string().optional().nullable(),
  pending: z.string().optional().nullable(),
  blockers: z.string().optional().nullable(),
  improvements: z.string().optional().nullable()
});
