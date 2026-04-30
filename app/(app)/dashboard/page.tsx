"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Flame, Goal, ListTodo } from "lucide-react";
import { Badge, PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { Card, StatCard } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import type { GoalDTO, HabitDTO, ProjectDTO, TaskDTO } from "@/lib/client-types";

type DashboardData = {
  todayTasks: TaskDTO[];
  overdueTasks: TaskDTO[];
  upcomingTasks: TaskDTO[];
  habitsToday: HabitDTO[];
  goals: GoalDTO[];
  projects: ProjectDTO[];
  stats: {
    completedThisWeek: number;
    completionRate: number;
    habitsDoneThisWeek: number;
    habitsDoneToday: number;
    goalsInProgress: number;
  };
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const response = await fetch("/api/dashboard");
    const payload = await response.json();
    setData(payload);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <EmptyState title="Nao foi possivel carregar o dashboard." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Visao pratica do que precisa da sua atencao hoje.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/meu-dia" className="inline-flex h-10 items-center justify-center rounded-md border border-brand-600 bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
            Abrir Meu Dia
          </Link>
          <Link href="/tarefas" className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-brand-50">
            Nova tarefa
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Concluidas na semana" value={data.stats.completedThisWeek} icon={<CheckCircle2 className="h-5 w-5" />} />
        <StatCard label="Taxa de conclusao" value={`${data.stats.completionRate}%`} icon={<ListTodo className="h-5 w-5" />} />
        <StatCard label="Habitos cumpridos" value={data.stats.habitsDoneThisWeek} detail={`${data.stats.habitsDoneToday} hoje`} icon={<Flame className="h-5 w-5" />} />
        <StatCard label="Metas em andamento" value={data.stats.goalsInProgress} icon={<Goal className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Tarefas de hoje</h2>
            <Badge className="bg-brand-50 text-brand-700">{data.todayTasks.length}</Badge>
          </div>
          {data.todayTasks.length ? (
            <div className="space-y-3">
              {data.todayTasks.map((task) => (
                <TaskRow key={task.id} task={task} onDone={load} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nada vencendo hoje." description="Use Meu Dia para escolher prioridades ou capturar uma tarefa nova." />
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">Habitos do dia</h2>
            <Badge className="bg-mint-50 text-mint-600">{data.habitsToday.length}</Badge>
          </div>
          {data.habitsToday.length ? (
            <div className="space-y-3">
              {data.habitsToday.map((habit) => (
                <div key={habit.id} className="flex items-center justify-between rounded-md border border-line p-3">
                  <div>
                    <p className="font-medium text-ink">{habit.name}</p>
                    <p className="text-xs text-muted">Streak {habit.streakCurrent} / melhor {habit.streakBest}</p>
                  </div>
                  <button
                    className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint-50"
                    onClick={async () => {
                      const done = habit.logs.some((log) => log.completed);
                      await fetch(`/api/habits/${habit.id}/log`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completed: !done })
                      });
                      load();
                    }}
                  >
                    {habit.logs.some((log) => log.completed) ? "Desfazer" : "Feito"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhum habito para hoje." />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">Atrasadas</h2>
          <TaskList tasks={data.overdueTasks} empty="Sem atrasos." />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">Proximas</h2>
          <TaskList tasks={data.upcomingTasks} empty="Nenhuma proxima tarefa." />
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">Metas</h2>
          <div className="space-y-4">
            {data.goals.length ? data.goals.map((goal) => (
              <div key={goal.id}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{goal.title}</p>
                  <span className="text-sm font-medium text-muted">{goal.progress}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-mint-500" style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            )) : <EmptyState title="Nenhuma meta em andamento." />}
          </div>
        </Card>
      </div>
    </div>
  );
}

function TaskList({ tasks, empty }: { tasks: TaskDTO[]; empty: string }) {
  if (!tasks.length) return <p className="text-sm text-muted">{empty}</p>;

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-md border border-line p-3">
          <p className="font-medium text-ink">{task.title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskRow({ task, onDone }: { task: TaskDTO; onDone: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-line p-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-ink">{task.title}</p>
          <PriorityBadge priority={task.priority} />
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted">
          <Clock3 className="h-3.5 w-3.5" />
          {task.estimatedMinutes ? `${task.estimatedMinutes} min` : "Sem estimativa"}
        </p>
      </div>
      <button
        className="rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink hover:bg-mint-50"
        onClick={async () => {
          await fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "concluida" })
          });
          onDone();
        }}
      >
        Concluir
      </button>
    </div>
  );
}
