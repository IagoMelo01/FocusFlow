"use client";

import { useEffect } from "react";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ErrorText, Label, inputClass, textareaClass } from "@/components/ui/form";
import type { ProjectDTO, TaskDTO } from "@/lib/client-types";

type TaskFormValues = {
  title: string;
  description: string;
  status: TaskDTO["status"];
  priority: TaskDTO["priority"];
  dueDate: string;
  projectId: string;
  tagsText: string;
  energy: TaskDTO["energy"];
  estimatedMinutes: string;
  isImportant: boolean;
  isUrgent: boolean;
};

export function TaskForm({
  projects,
  initialTask,
  onSubmit,
  submitting,
  submitLabel = "Salvar tarefa"
}: {
  projects: ProjectDTO[];
  initialTask?: TaskDTO | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<TaskFormValues>({
    defaultValues: toValues(initialTask)
  });

  useEffect(() => {
    reset(toValues(initialTask));
  }, [initialTask, reset]);

  async function submit(values: TaskFormValues) {
    const tags = values.tagsText
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    await onSubmit({
      title: values.title,
      description: values.description,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
      projectId: values.projectId || null,
      tags,
      energy: values.energy,
      estimatedMinutes: values.estimatedMinutes ? Number(values.estimatedMinutes) : null,
      isImportant: values.isImportant,
      isUrgent: values.isUrgent
    });

    if (!initialTask) reset(toValues(null));
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit(submit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Titulo</Label>
          <input
            className={inputClass}
            {...register("title", { required: "Informe o titulo.", minLength: { value: 2, message: "Use ao menos 2 caracteres." } })}
          />
          <ErrorText>{errors.title?.message}</ErrorText>
        </div>

        <div className="space-y-1.5">
          <Label>Projeto</Label>
          <select className={inputClass} {...register("projectId")}>
            <option value="">Sem projeto</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descricao</Label>
        <textarea className={textareaClass} rows={3} {...register("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <select className={inputClass} {...register("status")}>
            <option value="inbox">Inbox</option>
            <option value="a_fazer">A fazer</option>
            <option value="fazendo">Fazendo</option>
            <option value="aguardando">Aguardando</option>
            <option value="concluida">Concluida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <select className={inputClass} {...register("priority")}>
            <option value="baixa">Baixa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Vencimento</Label>
          <input className={inputClass} type="date" {...register("dueDate")} />
        </div>

        <div className="space-y-1.5">
          <Label>Energia</Label>
          <select className={inputClass} {...register("energy")}>
            <option value="baixo">Baixo</option>
            <option value="medio">Medio</option>
            <option value="alto">Alto</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <div className="space-y-1.5">
          <Label>Tags</Label>
          <input className={inputClass} placeholder="trabalho, casa, estudo" {...register("tagsText")} />
        </div>

        <div className="space-y-1.5">
          <Label>Minutos</Label>
          <input className={inputClass} min={1} type="number" {...register("estimatedMinutes")} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <input className="h-4 w-4 rounded border-line text-brand-600" type="checkbox" {...register("isImportant")} />
          Importante
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <input className="h-4 w-4 rounded border-line text-brand-600" type="checkbox" {...register("isUrgent")} />
          Urgente
        </label>
      </div>

      <Button className="w-fit" disabled={submitting}>
        <Save className="h-4 w-4" />
        {submitting ? "Salvando..." : submitLabel}
      </Button>
    </form>
  );
}

function toValues(task?: TaskDTO | null): TaskFormValues {
  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? "a_fazer",
    priority: task?.priority ?? "media",
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : "",
    projectId: task?.projectId ?? "",
    tagsText: task?.tagNames?.join(", ") ?? "",
    energy: task?.energy ?? "medio",
    estimatedMinutes: task?.estimatedMinutes ? String(task.estimatedMinutes) : "",
    isImportant: task?.isImportant ?? false,
    isUrgent: task?.isUrgent ?? false
  };
}
