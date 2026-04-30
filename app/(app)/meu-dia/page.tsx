"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { TaskDTO } from "@/lib/client-types";

type DailyPlanPayload = {
  date: string;
  reflection: string;
};

type DailyPlanTask = {
  task: TaskDTO;
  isMainPriority: boolean;
};

type DailyPlanData = {
  date: string;
  plan?: {
    reflection?: string | null;
    tasks: DailyPlanTask[];
  } | null;
  dueToday: TaskDTO[];
  overdue: TaskDTO[];
  availableTasks: TaskDTO[];
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function MyDayPage() {
  const [data, setData] = useState<DailyPlanData | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [mainPriorityIds, setMainPriorityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, watch, setValue, handleSubmit } = useForm<DailyPlanPayload>({
    defaultValues: {
      date: todayInput(),
      reflection: ""
    }
  });
  const selectedDate = watch("date");

  async function load(date = selectedDate) {
    setLoading(true);
    const response = await fetch(`/api/daily-plan?date=${date}`);
    const payload: DailyPlanData = await response.json();
    setData(payload);
    setSelectedTaskIds(payload.plan?.tasks.map((item) => item.task.id) ?? []);
    setMainPriorityIds(payload.plan?.tasks.filter((item) => item.isMainPriority).map((item) => item.task.id) ?? []);
    setValue("reflection", payload.plan?.reflection ?? "");
    setLoading(false);
  }

  useEffect(() => {
    load(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const selectedTasks = useMemo(
    () => data?.availableTasks.filter((task) => selectedTaskIds.includes(task.id)) ?? [],
    [data?.availableTasks, selectedTaskIds]
  );

  function toggleTask(id: string) {
    setSelectedTaskIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    setMainPriorityIds((current) => current.filter((item) => item !== id));
  }

  function toggleMain(id: string) {
    setMainPriorityIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) {
        window.alert("Escolha no maximo 3 prioridades principais.");
        return current;
      }
      return [...current, id];
    });
  }

  async function save(values: DailyPlanPayload) {
    setSaving(true);
    const response = await fetch("/api/daily-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: values.date,
        reflection: values.reflection,
        taskIds: selectedTaskIds,
        mainPriorityTaskIds: mainPriorityIds
      })
    });
    setSaving(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      window.alert(payload?.error || "Nao foi possivel salvar o plano.");
      return;
    }
    await load(values.date);
  }

  async function completeTask(taskId: string) {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "concluida" })
    });
    await load(selectedDate);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Meu Dia</h1>
        <p className="mt-1 text-sm text-muted">Escolha o essencial e mantenha ate 3 prioridades principais.</p>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1fr_360px]" onSubmit={handleSubmit(save)}>
        <div className="space-y-6">
          <Card>
            <div className="mb-4 grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="space-y-1.5">
                <Label>Data</Label>
                <input className={inputClass} type="date" {...register("date")} />
              </div>
              <div className="rounded-md border border-line bg-brand-50 p-4">
                <p className="text-sm font-semibold text-brand-700">Prioridades principais</p>
                <p className="mt-1 text-sm text-muted">{mainPriorityIds.length}/3 selecionadas</p>
              </div>
            </div>

            {loading ? <LoadingState /> : null}
            {!loading && selectedTasks.length ? (
              <div className="space-y-3">
                {selectedTasks.map((task) => (
                  <div key={task.id} className="rounded-md border border-line p-4">
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                      <TaskLine task={task} />
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant={mainPriorityIds.includes(task.id) ? "primary" : "secondary"} onClick={() => toggleMain(task.id)}>
                          Top 3
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => completeTask(task.id)}>
                          <CheckCircle2 className="h-4 w-4" />
                          Concluir
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : !loading ? (
              <EmptyState title="Nenhuma tarefa escolhida para este dia." />
            ) : null}
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Observacao e reflexao</h2>
            <textarea className={textareaClass} rows={5} {...register("reflection")} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Vencendo hoje</h2>
            <SelectableTasks tasks={data?.dueToday ?? []} selected={selectedTaskIds} onToggle={toggleTask} />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Atrasadas</h2>
            <SelectableTasks tasks={data?.overdue ?? []} selected={selectedTaskIds} onToggle={toggleTask} />
          </Card>

          <Card>
            <h2 className="mb-3 text-lg font-semibold text-ink">Todas disponiveis</h2>
            <SelectableTasks tasks={data?.availableTasks ?? []} selected={selectedTaskIds} onToggle={toggleTask} compact />
          </Card>

          <Button className="w-full" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Meu Dia"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function SelectableTasks({
  tasks,
  selected,
  onToggle,
  compact = false
}: {
  tasks: TaskDTO[];
  selected: string[];
  onToggle: (id: string) => void;
  compact?: boolean;
}) {
  if (!tasks.length) return <p className="text-sm text-muted">Nada aqui.</p>;

  return (
    <div className={`space-y-2 ${compact ? "max-h-80 overflow-y-auto pr-1" : ""}`}>
      {tasks.map((task) => (
        <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-md border border-line p-3 hover:bg-slate-50">
          <input className="mt-1 h-4 w-4" type="checkbox" checked={selected.includes(task.id)} onChange={() => onToggle(task.id)} />
          <TaskLine task={task} />
        </label>
      ))}
    </div>
  );
}

function TaskLine({ task }: { task: TaskDTO }) {
  return (
    <div className="min-w-0">
      <p className="font-medium text-ink">{task.title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
        {task.dueDate ? <span className="text-xs font-medium text-muted">{format(new Date(task.dueDate), "dd/MM")}</span> : null}
      </div>
    </div>
  );
}
