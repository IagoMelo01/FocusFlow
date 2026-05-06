"use client";

import { useEffect } from "react";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { ErrorText, Label, inputClass, textareaClass } from "@/components/ui/form";
import type { ProjectDTO, TaskDTO } from "@/lib/client-types";
import { useI18n } from "@/lib/i18n";

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
  submitLabel
}: {
  projects: ProjectDTO[];
  initialTask?: TaskDTO | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const { t, label } = useI18n();
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
          <Label>{t("common.title")}</Label>
          <input
            className={inputClass}
            {...register("title", { required: "Informe o titulo.", minLength: { value: 2, message: "Use ao menos 2 caracteres." } })}
          />
          <ErrorText>{errors.title?.message}</ErrorText>
        </div>

        <div className="space-y-1.5">
          <Label>{t("common.project")}</Label>
          <select className={inputClass} {...register("projectId")}>
            <option value="">{t("common.noProject")}</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>{t("common.description")}</Label>
        <textarea className={textareaClass} rows={3} {...register("description")} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="space-y-1.5">
          <Label>{t("common.status")}</Label>
          <select className={inputClass} {...register("status")}>
            <option value="inbox">{label("status", "inbox")}</option>
            <option value="a_fazer">{label("status", "a_fazer")}</option>
            <option value="fazendo">{label("status", "fazendo")}</option>
            <option value="aguardando">{label("status", "aguardando")}</option>
            <option value="concluida">{label("status", "concluida")}</option>
            <option value="cancelada">{label("status", "cancelada")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("common.priority")}</Label>
          <select className={inputClass} {...register("priority")}>
            <option value="baixa">{label("priority", "baixa")}</option>
            <option value="media">{label("priority", "media")}</option>
            <option value="alta">{label("priority", "alta")}</option>
            <option value="urgente">{label("priority", "urgente")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("tasks.dueDate")}</Label>
          <input className={inputClass} type="date" {...register("dueDate")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("tasks.energy")}</Label>
          <select className={inputClass} {...register("energy")}>
            <option value="baixo">{label("energy", "baixo")}</option>
            <option value="medio">{label("energy", "medio")}</option>
            <option value="alto">{label("energy", "alto")}</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_160px]">
        <div className="space-y-1.5">
          <Label>{t("common.tags")}</Label>
          <input className={inputClass} placeholder={t("tasks.tagPlaceholder")} {...register("tagsText")} />
        </div>

        <div className="space-y-1.5">
          <Label>{t("tasks.estimatedMinutes")}</Label>
          <input className={inputClass} min={1} type="number" {...register("estimatedMinutes")} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <input className="h-4 w-4 rounded border-line text-brand-600" type="checkbox" {...register("isImportant")} />
          {t("tasks.important")}
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink">
          <input className="h-4 w-4 rounded border-line text-brand-600" type="checkbox" {...register("isUrgent")} />
          {t("tasks.urgent")}
        </label>
      </div>

      <Button className="w-fit" disabled={submitting}>
        <Save className="h-4 w-4" />
        {submitting ? t("common.saving") : submitLabel ?? t("tasks.saveTask")}
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
