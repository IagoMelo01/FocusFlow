"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek } from "date-fns";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { TaskDTO } from "@/lib/client-types";

type ReviewForm = {
  weekStart: string;
  weeklyGoals: string;
  completed: string;
  pending: string;
  blockers: string;
  improvements: string;
};

type ReviewData = {
  weekStart: string;
  weekEnd: string;
  review?: Partial<ReviewForm> | null;
  days: Array<{ date: string; tasks: TaskDTO[] }>;
};

function currentWeekInput() {
  return startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);
}

export default function WeeklyReviewPage() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting }
  } = useForm<ReviewForm>({
    defaultValues: {
      weekStart: currentWeekInput(),
      weeklyGoals: "",
      completed: "",
      pending: "",
      blockers: "",
      improvements: ""
    }
  });
  const weekStart = watch("weekStart");

  async function load(start = weekStart) {
    setLoading(true);
    const response = await fetch(`/api/weekly-review?weekStart=${start}`);
    const payload: ReviewData = await response.json();
    setData(payload);
    reset({
      weekStart: payload.weekStart.slice(0, 10),
      weeklyGoals: payload.review?.weeklyGoals ?? "",
      completed: payload.review?.completed ?? "",
      pending: payload.review?.pending ?? "",
      blockers: payload.review?.blockers ?? "",
      improvements: payload.review?.improvements ?? ""
    });
    setLoading(false);
  }

  useEffect(() => {
    load(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  async function save(values: ReviewForm) {
    const response = await fetch("/api/weekly-review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      window.alert("Nao foi possivel salvar a revisao.");
      return;
    }

    await load(values.weekStart);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Revisao Semanal</h1>
        <p className="mt-1 text-sm text-muted">Planeje a semana e registre aprendizados.</p>
      </div>

      <Card>
        <div className="space-y-1.5 md:max-w-xs">
          <Label>Semana iniciando em</Label>
          <input className={inputClass} type="date" {...register("weekStart")} />
        </div>
      </Card>

      {loading ? <LoadingState /> : null}

      {!loading && data ? (
        <>
          <div className="grid gap-4 lg:grid-cols-7">
            {data.days.map((day) => (
              <div key={day.date} className="min-h-60 rounded-lg border border-line bg-white p-3">
                <p className="mb-3 text-sm font-semibold text-ink">{format(new Date(day.date), "EEE dd/MM")}</p>
                <div className="space-y-2">
                  {day.tasks.length ? day.tasks.map((task) => (
                    <div key={task.id} className="rounded-md border border-line p-2">
                      <p className="text-sm font-medium text-ink">{task.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted">Sem tarefas.</p>}
                </div>
              </div>
            ))}
          </div>

          <Card>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(save)}>
              <div className="space-y-1.5 md:col-span-2">
                <Label>Metas da semana</Label>
                <textarea className={textareaClass} rows={3} {...register("weeklyGoals")} />
              </div>
              <Question label="O que consegui concluir?" field="completed" register={register} />
              <Question label="O que ficou pendente?" field="pending" register={register} />
              <Question label="O que me atrapalhou?" field="blockers" register={register} />
              <Question label="O que posso melhorar na proxima semana?" field="improvements" register={register} />
              <Button className="w-fit md:col-span-2" disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                Salvar revisao
              </Button>
            </form>
          </Card>
        </>
      ) : !loading ? (
        <EmptyState title="Semana nao encontrada." />
      ) : null}
    </div>
  );
}

function Question({
  label,
  field,
  register
}: {
  label: string;
  field: keyof ReviewForm;
  register: ReturnType<typeof useForm<ReviewForm>>["register"];
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea className={textareaClass} rows={4} {...register(field)} />
    </div>
  );
}
