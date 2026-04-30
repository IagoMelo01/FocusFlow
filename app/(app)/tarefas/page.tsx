"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, LayoutDashboard, List, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { TaskForm } from "@/components/tasks/task-form";
import { PriorityBadge, StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { inputClass } from "@/components/ui/form";
import type { ProjectDTO, TaskDTO } from "@/lib/client-types";

const kanbanColumns: Array<{ status: TaskDTO["status"]; label: string }> = [
  { status: "inbox", label: "Inbox" },
  { status: "a_fazer", label: "A fazer" },
  { status: "fazendo", label: "Fazendo" },
  { status: "aguardando", label: "Aguardando" },
  { status: "concluida", label: "Concluida" }
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<TaskDTO | null>(null);
  const [view, setView] = useState<"list" | "kanban" | "matrix">("list");
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    projectId: "",
    tag: "",
    search: ""
  });

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    const [taskResponse, projectResponse] = await Promise.all([
      fetch(`/api/tasks?${params.toString()}`),
      fetch("/api/projects")
    ]);
    const taskPayload = await taskResponse.json();
    const projectPayload = await projectResponse.json();
    setTasks(taskPayload.tasks ?? []);
    setProjects(projectPayload.projects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.priority, filters.projectId, filters.tag]);

  async function saveTask(payload: Record<string, unknown>) {
    setSubmitting(true);
    const response = await fetch(editing ? `/api/tasks/${editing.id}` : "/api/tasks", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setSubmitting(false);

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      window.alert(error?.error || "Nao foi possivel salvar a tarefa.");
      return;
    }

    setEditing(null);
    await load();
  }

  async function patchTask(id: string, payload: Record<string, unknown>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    await load();
  }

  async function deleteTask(id: string) {
    if (!window.confirm("Excluir esta tarefa?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    await load();
  }

  const matrix = useMemo(() => ({
    now: tasks.filter((task) => task.isImportant && task.isUrgent),
    plan: tasks.filter((task) => task.isImportant && !task.isUrgent),
    delegate: tasks.filter((task) => !task.isImportant && task.isUrgent),
    eliminate: tasks.filter((task) => !task.isImportant && !task.isUrgent)
  }), [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Tarefas</h1>
          <p className="mt-1 text-sm text-muted">Organize acoes por GTD, Kanban e Matriz de Eisenhower.</p>
        </div>
        <div className="flex rounded-md border border-line bg-white p-1">
          <ViewButton active={view === "list"} onClick={() => setView("list")} icon={<List className="h-4 w-4" />} label="Lista" />
          <ViewButton active={view === "kanban"} onClick={() => setView("kanban")} icon={<LayoutDashboard className="h-4 w-4" />} label="Kanban" />
          <ViewButton active={view === "matrix"} onClick={() => setView("matrix")} icon={<Plus className="h-4 w-4" />} label="Matriz" />
        </div>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{editing ? "Editar tarefa" : "Criar tarefa"}</h2>
          {editing ? (
            <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          ) : null}
        </div>
        <TaskForm
          projects={projects}
          initialTask={editing}
          onSubmit={saveTask}
          submitting={submitting}
          submitLabel={editing ? "Atualizar tarefa" : "Criar tarefa"}
        />
      </Card>

      <Card>
        <div className="grid gap-3 md:grid-cols-5">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted" />
            <input
              className={`${inputClass} pl-9`}
              placeholder="Buscar por titulo ou descricao"
              value={filters.search}
              onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") load();
              }}
            />
          </div>
          <select className={inputClass} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">Todos status</option>
            <option value="inbox">Inbox</option>
            <option value="a_fazer">A fazer</option>
            <option value="fazendo">Fazendo</option>
            <option value="aguardando">Aguardando</option>
            <option value="concluida">Concluida</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select className={inputClass} value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">Todas prioridades</option>
            <option value="baixa">Baixa</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="urgente">Urgente</option>
          </select>
          <select className={inputClass} value={filters.projectId} onChange={(event) => setFilters((current) => ({ ...current, projectId: event.target.value }))}>
            <option value="">Todos projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <input
            className={inputClass}
            placeholder="Filtrar tag"
            value={filters.tag}
            onChange={(event) => setFilters((current) => ({ ...current, tag: event.target.value }))}
          />
          <Button variant="secondary" onClick={load}>
            Buscar
          </Button>
        </div>
      </Card>

      {loading ? <LoadingState /> : null}
      {!loading && view === "list" ? <TaskList tasks={tasks} onEdit={setEditing} onPatch={patchTask} onDelete={deleteTask} /> : null}
      {!loading && view === "kanban" ? <Kanban tasks={tasks} onPatch={patchTask} onEdit={setEditing} onDelete={deleteTask} /> : null}
      {!loading && view === "matrix" ? <Eisenhower matrix={matrix} onEdit={setEditing} onPatch={patchTask} /> : null}
    </div>
  );
}

function ViewButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ${active ? "bg-brand-600 text-white" : "text-muted hover:bg-slate-50 hover:text-ink"}`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
}

function TaskList({
  tasks,
  onEdit,
  onPatch,
  onDelete
}: {
  tasks: TaskDTO[];
  onEdit: (task: TaskDTO) => void;
  onPatch: (id: string, payload: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
}) {
  if (!tasks.length) return <EmptyState title="Nenhuma tarefa encontrada." />;

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <TaskSummary task={task} />
          <div className="mt-4 flex flex-wrap gap-2">
            {task.status !== "concluida" ? (
              <Button size="sm" variant="secondary" onClick={() => onPatch(task.id, { status: "concluida" })}>
                <Check className="h-4 w-4" />
                Concluir
              </Button>
            ) : null}
            <Button size="sm" variant="secondary" onClick={() => onEdit(task)}>
              <Pencil className="h-4 w-4" />
              Editar
            </Button>
            <Button size="sm" variant="danger" onClick={() => onDelete(task.id)}>
              <Trash2 className="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

function Kanban({
  tasks,
  onPatch,
  onEdit,
  onDelete
}: {
  tasks: TaskDTO[];
  onPatch: (id: string, payload: Record<string, unknown>) => void;
  onEdit: (task: TaskDTO) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-5">
      {kanbanColumns.map((column) => (
        <div key={column.status} className="min-h-96 rounded-lg border border-line bg-white p-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{column.label}</h2>
            <span className="text-xs font-medium text-muted">{tasks.filter((task) => task.status === column.status).length}</span>
          </div>
          <div className="space-y-3">
            {tasks.filter((task) => task.status === column.status).map((task) => (
              <div key={task.id} className="rounded-md border border-line bg-slate-50 p-3">
                <TaskSummary task={task} compact />
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <select
                    className={inputClass}
                    value={task.status}
                    onChange={(event) => onPatch(task.id, { status: event.target.value })}
                  >
                    {kanbanColumns.map((item) => (
                      <option key={item.status} value={item.status}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <Button size="sm" variant="secondary" onClick={() => onEdit(task)}>
                    Editar
                  </Button>
                </div>
                <Button className="mt-2 w-full" size="sm" variant="ghost" onClick={() => onDelete(task.id)}>
                  Excluir
                </Button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Eisenhower({
  matrix,
  onEdit,
  onPatch
}: {
  matrix: Record<"now" | "plan" | "delegate" | "eliminate", TaskDTO[]>;
  onEdit: (task: TaskDTO) => void;
  onPatch: (id: string, payload: Record<string, unknown>) => void;
}) {
  const quadrants = [
    { key: "now", title: "Fazer agora", subtitle: "Urgente e importante", tone: "border-red-200 bg-red-50" },
    { key: "plan", title: "Planejar", subtitle: "Importante e nao urgente", tone: "border-blue-200 bg-blue-50" },
    { key: "delegate", title: "Delegar ou resolver rapido", subtitle: "Urgente e nao importante", tone: "border-amber-200 bg-amber-50" },
    { key: "eliminate", title: "Eliminar", subtitle: "Nem urgente nem importante", tone: "border-slate-200 bg-slate-50" }
  ] as const;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {quadrants.map((quadrant) => (
        <div key={quadrant.key} className={`min-h-80 rounded-lg border p-4 ${quadrant.tone}`}>
          <div className="mb-4">
            <h2 className="font-semibold text-ink">{quadrant.title}</h2>
            <p className="text-sm text-muted">{quadrant.subtitle}</p>
          </div>
          <div className="space-y-3">
            {matrix[quadrant.key].length ? matrix[quadrant.key].map((task) => (
              <div key={task.id} className="rounded-md border border-line bg-white p-3">
                <TaskSummary task={task} compact />
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => onEdit(task)}>
                    Editar
                  </Button>
                  <Button size="sm" onClick={() => onPatch(task.id, { status: "concluida" })}>
                    Concluir
                  </Button>
                </div>
              </div>
            )) : <p className="text-sm text-muted">Sem tarefas neste quadrante.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function TaskSummary({ task, compact = false }: { task: TaskDTO; compact?: boolean }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={`${compact ? "text-sm" : "text-base"} font-semibold text-ink`}>{task.title}</h3>
        <PriorityBadge priority={task.priority} />
        <StatusBadge status={task.status} />
      </div>
      {task.description && !compact ? <p className="mt-2 text-sm text-muted">{task.description}</p> : null}
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
        {task.project ? <span>{task.project.name}</span> : <span>Sem projeto</span>}
        {task.dueDate ? <span>Vence {task.dueDate.slice(0, 10)}</span> : <span>Sem data</span>}
        {task.estimatedMinutes ? <span>{task.estimatedMinutes} min</span> : null}
        <span>{task.energy}</span>
      </div>
      {task.tagNames?.length ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {task.tagNames.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              #{tag}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
