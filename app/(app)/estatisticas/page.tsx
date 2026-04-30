"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Clock, ListChecks } from "lucide-react";
import { Card, StatCard } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";

type StatsData = {
  tasksCompletedByDay: Array<{ day: string; concluidas: number }>;
  tasksByPriority: Array<{ priority: string; total: number }>;
  habitsByDay: Array<{ day: string; feitos: number }>;
  focusByDay: Array<{ day: string; minutos: number }>;
  productivityWeekly: Array<{ day: string; score: number }>;
  focusTotalMinutes: number;
  projects: Array<{ name: string; progresso: number }>;
};

const colors = ["#2081c3", "#1f9d72", "#f59e0b", "#dc2626", "#7c3aed"];

export default function StatsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/stats");
      const payload = await response.json();
      setData(payload);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <EmptyState title="Nao foi possivel carregar estatisticas." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Estatisticas</h1>
        <p className="mt-1 text-sm text-muted">Relatorios baseados nos registros reais da semana.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Tempo total em foco" value={`${data.focusTotalMinutes} min`} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Tarefas concluidas" value={data.tasksCompletedByDay.reduce((sum, item) => sum + item.concluidas, 0)} icon={<ListChecks className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Tarefas concluidas por dia">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.tasksCompletedByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ea" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="concluidas" fill="#2081c3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Produtividade semanal">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={data.productivityWeekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ea" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#1f9d72" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Habitos cumpridos">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.habitsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ea" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="feitos" fill="#1f9d72" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tempo de foco por dia">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.focusByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ea" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="minutos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tarefas por prioridade">
          {data.tasksByPriority.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.tasksByPriority} dataKey="total" nameKey="priority" outerRadius={90} label>
                  {data.tasksByPriority.map((entry, index) => (
                    <Cell key={entry.priority} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sem tarefas para agrupar." />
          )}
        </ChartCard>

        <ChartCard title="Projetos com maior progresso">
          {data.projects.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.projects} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d9e1ea" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={120} />
                <Tooltip />
                <Bar dataKey="progresso" fill="#2081c3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Sem projetos com tarefas." />
          )}
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-semibold text-ink">{title}</h2>
      {children}
    </Card>
  );
}
