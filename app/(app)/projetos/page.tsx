"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { ProjectDTO } from "@/lib/client-types";

type ProjectForm = {
  name: string;
  description: string;
  status: ProjectDTO["status"];
  startDate: string;
  targetDate: string;
  color: string;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ProjectDTO | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<ProjectForm>({ defaultValues: emptyProject() });

  async function load() {
    setLoading(true);
    const response = await fetch("/api/projects");
    const payload = await response.json();
    setProjects(payload.projects ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function edit(project: ProjectDTO) {
    setEditing(project);
    reset({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      startDate: project.startDate?.slice(0, 10) ?? "",
      targetDate: project.targetDate?.slice(0, 10) ?? "",
      color: project.color
    });
  }

  async function save(values: ProjectForm) {
    const response = await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        startDate: values.startDate || null,
        targetDate: values.targetDate || null
      })
    });

    if (!response.ok) {
      window.alert("Nao foi possivel salvar o projeto.");
      return;
    }

    setEditing(null);
    reset(emptyProject());
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir projeto? As tarefas ficam sem projeto.")) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Projetos</h1>
        <p className="mt-1 text-sm text-muted">Agrupe tarefas e acompanhe progresso automatico.</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">{editing ? "Editar projeto" : "Novo projeto"}</h2>
          {editing ? (
            <Button variant="ghost" size="sm" onClick={() => { setEditing(null); reset(emptyProject()); }}>
              Cancelar
            </Button>
          ) : null}
        </div>

        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(save)}>
          <div className="space-y-1.5">
            <Label>Nome</Label>
            <input className={inputClass} {...register("name", { required: true })} />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select className={inputClass} {...register("status")}>
              <option value="ativo">Ativo</option>
              <option value="pausado">Pausado</option>
              <option value="concluido">Concluido</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Descricao</Label>
            <textarea className={textareaClass} rows={3} {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Data inicial</Label>
            <input className={inputClass} type="date" {...register("startDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>Data final prevista</Label>
            <input className={inputClass} type="date" {...register("targetDate")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cor</Label>
            <input className={`${inputClass} h-10 p-1`} type="color" {...register("color")} />
          </div>
          <div className="flex items-end">
            <Button disabled={isSubmitting}>
              <Save className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar projeto"}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? <LoadingState /> : null}
      {!loading && !projects.length ? <EmptyState title="Nenhum projeto criado." /> : null}
      {!loading && projects.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => (
            <Card key={project.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
                    <h2 className="font-semibold text-ink">{project.name}</h2>
                  </div>
                  <p className="mt-1 text-sm text-muted">{project.description || "Sem descricao."}</p>
                </div>
                <Badge className="bg-slate-100 text-slate-700">{project.status}</Badge>
              </div>
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted">Progresso</span>
                  <span className="font-semibold text-ink">{project.progress ?? 0}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-brand-600" style={{ width: `${project.progress ?? 0}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted">{project.completedTaskCount ?? 0}/{project.taskCount ?? 0} tarefas concluidas</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => edit(project)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button size="sm" variant="danger" onClick={() => remove(project.id)}>
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function emptyProject(): ProjectForm {
  return {
    name: "",
    description: "",
    status: "ativo",
    startDate: "",
    targetDate: "",
    color: "#2081c3"
  };
}
