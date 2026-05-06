"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Save, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import type { NoteDTO } from "@/lib/client-types";
import { useI18n } from "@/lib/i18n";

type NoteForm = {
  title: string;
  content: string;
  tagsText: string;
};

export default function NotesPage() {
  const [notes, setNotes] = useState<NoteDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<NoteDTO | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting }
  } = useForm<NoteForm>({ defaultValues: emptyNote() });

  async function load(query = search) {
    setLoading(true);
    const params = query ? `?search=${encodeURIComponent(query)}` : "";
    const response = await fetch(`/api/notes${params}`);
    const payload = await response.json();
    setNotes(payload.notes ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(note: NoteDTO) {
    setEditing(note);
    reset({
      title: note.title,
      content: note.content,
      tagsText: (note.tags ?? []).join(", ")
    });
  }

  async function save(values: NoteForm) {
    const response = await fetch(editing ? `/api/notes/${editing.id}` : "/api/notes", {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: values.title,
        content: values.content,
        tags: values.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean)
      })
    });

    if (!response.ok) {
      window.alert(t("notes.saveError"));
      return;
    }

    setEditing(null);
    reset(emptyNote());
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t("notes.deleteConfirm"))) return;
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    await load();
  }

  const content = watch("content");
  const preview = useMemo(() => content.split("\n").filter(Boolean), [content]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("nav.notes")}</h1>
        <p className="mt-1 text-sm text-muted">{t("notes.subtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{editing ? t("notes.edit") : t("notes.new")}</h2>
              {editing ? <Button size="sm" variant="ghost" onClick={() => { setEditing(null); reset(emptyNote()); }}>{t("common.cancel")}</Button> : null}
            </div>
            <form className="space-y-4" onSubmit={handleSubmit(save)}>
              <div className="space-y-1.5">
                <Label>{t("common.title")}</Label>
                <input className={inputClass} {...register("title", { required: true })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("notes.markdown")}</Label>
                <textarea className={textareaClass} rows={10} {...register("content")} />
              </div>
              <div className="space-y-1.5">
                <Label>{t("common.tags")}</Label>
                <input className={inputClass} placeholder={t("notes.tagPlaceholder")} {...register("tagsText")} />
              </div>
              <Button disabled={isSubmitting}>
                <Save className="h-4 w-4" />
                {t("notes.save")}
              </Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-ink">{t("notes.preview")}</h2>
            <div className="prose max-w-none text-sm text-ink">
              {preview.length ? preview.map((line, index) => (
                <p key={`${line}-${index}`} className={line.startsWith("#") ? "text-lg font-semibold" : ""}>
                  {line.replace(/^#+\s?/, "")}
                </p>
              )) : <p className="text-muted">{t("notes.previewEmpty")}</p>}
            </div>
          </Card>
        </div>

        <Card>
          <div className="mb-4 flex gap-2">
            <input className={inputClass} placeholder={t("notes.searchPlaceholder")} value={search} onChange={(event) => setSearch(event.target.value)} />
            <Button type="button" variant="secondary" onClick={() => load(search)}>
              {t("common.search")}
            </Button>
          </div>
          {loading ? <LoadingState /> : null}
          {!loading && !notes.length ? <EmptyState title={t("notes.none")} /> : null}
          {!loading && notes.length ? (
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="rounded-md border border-line p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">{note.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">{note.content}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted">{new Date(note.updatedAt).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {note.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {note.tags.map((tag) => <Badge key={tag} className="bg-slate-100 text-slate-700">{tag}</Badge>)}
                    </div>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => edit(note)}>
                      <Pencil className="h-4 w-4" />
                      {t("common.edit")}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => remove(note.id)}>
                      <Trash2 className="h-4 w-4" />
                      {t("common.delete")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

function emptyNote(): NoteForm {
  return { title: "", content: "", tagsText: "" };
}
