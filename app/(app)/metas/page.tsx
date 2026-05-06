"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { GoalDTO, TaskDTO } from "@/lib/client-types";
import { useI18n } from "@/lib/i18n";

type GoalForm = {
  title: string;
  description: string;
  category: GoalDTO["category"];
  startDate: string;
  dueDate: string;
  progress: number;
  status: GoalDTO["status"];
  taskIds: string[];
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalDTO[]>([]);
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<GoalDTO | null>(null);
  const { t, label } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting }
  } = useForm<GoalForm>({ defaultValues: emptyGoal() });

  async function load() {
    setLoading(true);
    const [goalResponse, taskResponse] = await Promise.all([
      fetch("/api/goals"),
      fetch("/api/tasks")
    ]);
    const goalPayload = await goalResponse.json();
    const taskPayload = await taskResponse.json();
    setGoals(goalPayload.goals ?? []);
    setTasks(taskPayload.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(goal: GoalDTO) {
    setEditing(goal);
    reset({
      title: goal.title,
      description: goal.description ?? "",
      category: goal.category,
      startDate: goal.startDate?.slice(0, 10) ?? "",
      dueDate: goal.dueDate?.slice(0, 10) ?? "",
      progress: goal.progress,
      status: goal.status,
      taskIds: goal.tasks?.map((item) => item.task.id) ?? []
    });
  }

  async function save(values: GoalForm) {
    const response = await fetch(editing ? `/api/goals/${editing.id}` : "/api/goals", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        progress: Number(values.progress),
        startDate: values.startDate || null,
        dueDate: values.dueDate || null,
        taskIds: values.taskIds ?? []
      })
    });

    if (!response.ok) {
      window.alert(t("goals.saveError"));
      return;
    }

    setEditing(null);
    reset(emptyGoal());
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t("goals.deleteConfirm"))) return;
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await load();
  }

  const progress = watch("progress");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("nav.goals")}</h1>
        <p className="mt-1 text-sm text-muted">{t("goals.subtitle")}</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{editing ? t("goals.edit") : t("goals.new")}</h2>
          {editing ? <Button size="sm" variant="ghost" onClick={() => { setEditing(null); reset(emptyGoal()); }}>{t("common.cancel")}</Button> : null}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(save)}>
          <div className="space-y-1.5">
            <Label>{t("common.title")}</Label>
            <input className={inputClass} {...register("title", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("goals.category")}</Label>
            <select className={inputClass} {...register("category")}>
              <option value="saude">{label("goalCategory", "saude")}</option>
              <option value="carreira">{label("goalCategory", "carreira")}</option>
              <option value="estudos">{label("goalCategory", "estudos")}</option>
              <option value="financeiro">{label("goalCategory", "financeiro")}</option>
              <option value="pessoal">{label("goalCategory", "pessoal")}</option>
              <option value="outro">{label("goalCategory", "outro")}</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("common.description")}</Label>
            <textarea className={textareaClass} rows={3} {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("goals.startDate")}</Label>
            <input className={inputClass} type="date" {...register("startDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("goals.dueDate")}</Label>
            <input className={inputClass} type="date" {...register("dueDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.status")}</Label>
            <select className={inputClass} {...register("status")}>
              <option value="em_andamento">{label("goalStatus", "em_andamento")}</option>
              <option value="concluida">{label("goalStatus", "concluida")}</option>
              <option value="pausada">{label("goalStatus", "pausada")}</option>
              <option value="cancelada">{label("goalStatus", "cancelada")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("goals.progress")}: {progress}%</Label>
            <input className="w-full accent-brand-600" min={0} max={100} type="range" {...register("progress", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>{t("goals.relatedTasks")}</Label>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-line p-3">
              {tasks.length ? tasks.map((task) => (
                <label key={task.id} className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" value={task.id} {...register("taskIds")} />
                  {task.title}
                </label>
              )) : <p className="text-sm text-muted">{t("goals.noTasks")}</p>}
            </div>
          </div>
          <Button className="w-fit md:col-span-2" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            {t("goals.save")}
          </Button>
        </form>
      </Card>

      {loading ? <LoadingState /> : null}
      {!loading && !goals.length ? <EmptyState title={t("goals.none")} /> : null}
      {!loading && goals.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.map((goal) => (
            <Card key={goal.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-ink">{goal.title}</h2>
                  <p className="mt-1 text-sm text-muted">{goal.description || t("common.noDescription")}</p>
                </div>
                <Badge className="bg-brand-50 text-brand-700">{label("goalCategory", goal.category)}</Badge>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted">{label("goalStatus", goal.status)}</span>
                  <span className="font-semibold text-ink">{goal.relatedTaskProgress ?? goal.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-mint-500" style={{ width: `${goal.relatedTaskProgress ?? goal.progress}%` }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => edit(goal)}>
                  <Pencil className="h-4 w-4" />
                  {t("common.edit")}
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(goal.id)}>
                  <Trash2 className="h-4 w-4" />
                  {t("common.delete")}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function emptyGoal(): GoalForm {
  return {
    title: "",
    description: "",
    category: "pessoal",
    startDate: "",
    dueDate: "",
    progress: 0,
    status: "em_andamento",
    taskIds: []
  };
}
