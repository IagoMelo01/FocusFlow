"use client";

import { useEffect, useState } from "react";
import { Check, Flame, Pencil, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { HabitDTO } from "@/lib/client-types";

type HabitForm = {
  name: string;
  description: string;
  frequency: "diaria" | "semanal";
  daysOfWeek: string[];
  suggestedTime: string;
  isActive: boolean;
};

const weekDays = [
  { value: "1", label: "Seg" },
  { value: "2", label: "Ter" },
  { value: "3", label: "Qua" },
  { value: "4", label: "Qui" },
  { value: "5", label: "Sex" },
  { value: "6", label: "Sab" },
  { value: "0", label: "Dom" }
];

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<HabitDTO | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<HabitForm>({ defaultValues: emptyHabit() });

  async function load() {
    setLoading(true);
    const response = await fetch("/api/habits");
    const payload = await response.json();
    setHabits(payload.habits ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(habit: HabitDTO) {
    setEditing(habit);
    reset({
      name: habit.name,
      description: habit.description ?? "",
      frequency: habit.frequency,
      daysOfWeek: (habit.daysOfWeek ?? [1, 2, 3, 4, 5]).map(String),
      suggestedTime: habit.suggestedTime ?? "",
      isActive: habit.isActive
    });
  }

  async function save(values: HabitForm) {
    const payload = {
      ...values,
      daysOfWeek: values.daysOfWeek.map(Number),
      suggestedTime: values.suggestedTime || null
    };

    const response = await fetch(editing ? `/api/habits/${editing.id}` : "/api/habits", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      window.alert("Nao foi possivel salvar o habito.");
      return;
    }

    setEditing(null);
    reset(emptyHabit());
    await load();
  }

  async function mark(habit: HabitDTO, completed: boolean) {
    await fetch(`/api/habits/${habit.id}/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayInput(), completed })
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir habito e historico?")) return;
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Habitos</h1>
        <p className="mt-1 text-sm text-muted">Controle frequencia, historico e sequencias.</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{editing ? "Editar habito" : "Novo habito"}</h2>
          {editing ? <Button variant="ghost" size="sm" onClick={() => { setEditing(null); reset(emptyHabit()); }}>Cancelar</Button> : null}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(save)}>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <input className={inputClass} {...register("name", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Frequencia</Label>
            <select className={inputClass} {...register("frequency")}>
              <option value="diaria">Diaria</option>
              <option value="semanal">Semanal</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Descricao</Label>
            <textarea className={textareaClass} rows={3} {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Horario sugerido</Label>
            <input className={inputClass} type="time" {...register("suggestedTime")} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <label className="mt-3 flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" {...register("isActive")} />
              Ativo
            </label>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Dias aplicaveis</Label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map((day) => (
                <label key={day.value} className="inline-flex h-9 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-medium">
                  <input type="checkbox" value={day.value} {...register("daysOfWeek")} />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <Button className="w-fit md:col-span-2" disabled={isSubmitting}>
            <Save className="h-4 w-4" />
            Salvar habito
          </Button>
        </form>
      </Card>

      {loading ? <LoadingState /> : null}
      {!loading && !habits.length ? <EmptyState title="Nenhum habito criado." /> : null}
      {!loading && habits.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {habits.map((habit) => {
            const doneToday = habit.logs.some((log) => log.date.slice(0, 10) === todayInput() && log.completed);
            return (
              <Card key={habit.id}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink">{habit.name}</h2>
                    <p className="mt-1 text-sm text-muted">{habit.description || "Sem descricao."}</p>
                  </div>
                  <Badge className={habit.isActive ? "bg-mint-50 text-mint-600" : "bg-slate-100 text-slate-700"}>
                    {habit.isActive ? "ativo" : "inativo"}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-line p-3">
                    <p className="flex items-center gap-2 text-sm font-medium text-muted"><Flame className="h-4 w-4" />Streak atual</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{habit.streakCurrent}</p>
                  </div>
                  <div className="rounded-md border border-line p-3">
                    <p className="text-sm font-medium text-muted">Maior streak</p>
                    <p className="mt-1 text-2xl font-semibold text-ink">{habit.streakBest}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant={doneToday ? "secondary" : "primary"} onClick={() => mark(habit, !doneToday)}>
                    <Check className="h-4 w-4" />
                    {doneToday ? "Desfazer hoje" : "Marcar hoje"}
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => edit(habit)}>
                    <Pencil className="h-4 w-4" />
                    Editar
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => remove(habit.id)}>
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-ink">Historico recente</p>
                  <div className="flex flex-wrap gap-1">
                    {habit.logs.slice(0, 21).map((log) => (
                      <span key={log.id} className="rounded bg-mint-50 px-2 py-1 text-xs font-medium text-mint-600">
                        {log.date.slice(5, 10)}
                      </span>
                    ))}
                    {!habit.logs.length ? <span className="text-sm text-muted">Sem registros.</span> : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function emptyHabit(): HabitForm {
  return {
    name: "",
    description: "",
    frequency: "diaria",
    daysOfWeek: ["1", "2", "3", "4", "5"],
    suggestedTime: "",
    isActive: true
  };
}
