export type ProjectDTO = {
  id: string;
  name: string;
  description?: string | null;
  status: "ativo" | "pausado" | "concluido" | "cancelado";
  startDate?: string | null;
  targetDate?: string | null;
  color: string;
  progress?: number;
  taskCount?: number;
  completedTaskCount?: number;
};

export type TaskDTO = {
  id: string;
  title: string;
  description?: string | null;
  status: "inbox" | "a_fazer" | "fazendo" | "aguardando" | "concluida" | "cancelada";
  priority: "baixa" | "media" | "alta" | "urgente";
  dueDate?: string | null;
  completedAt?: string | null;
  projectId?: string | null;
  project?: ProjectDTO | null;
  tagNames?: string[];
  energy: "baixo" | "medio" | "alto";
  estimatedMinutes?: number | null;
  isImportant: boolean;
  isUrgent: boolean;
};

export type HabitDTO = {
  id: string;
  name: string;
  description?: string | null;
  frequency: "diaria" | "semanal";
  daysOfWeek?: number[] | null;
  suggestedTime?: string | null;
  isActive: boolean;
  streakCurrent: number;
  streakBest: number;
  logs: Array<{ id: string; date: string; completed: boolean }>;
};

export type GoalDTO = {
  id: string;
  title: string;
  description?: string | null;
  category: "saude" | "carreira" | "estudos" | "financeiro" | "pessoal" | "outro";
  startDate?: string | null;
  dueDate?: string | null;
  progress: number;
  relatedTaskProgress?: number;
  status: "em_andamento" | "concluida" | "pausada" | "cancelada";
  tasks?: Array<{ task: TaskDTO }>;
};

export type NoteDTO = {
  id: string;
  title: string;
  content: string;
  tags?: string[] | null;
  createdAt: string;
  updatedAt: string;
};
