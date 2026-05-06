"use client";

import { useEffect, useMemo, useState } from "react";
import { InboxIcon, Send, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, LoadingState } from "@/components/ui/empty-state";
import { Label, inputClass, textareaClass } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n";

type InboxItem = {
  id: string;
  type: "tarefa" | "ideia" | "lembrete" | "anotacao";
  title: string;
  content?: string | null;
  status: "aberta" | "processada" | "descartada";
  createdAt: string;
};

type InboxForm = {
  type: InboxItem["type"];
  title: string;
  content: string;
};

export default function InboxPage() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, label } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting }
  } = useForm<InboxForm>({
    defaultValues: { type: "tarefa", title: "", content: "" }
  });

  async function load() {
    setLoading(true);
    const response = await fetch("/api/inbox");
    const payload = await response.json();
    setItems(payload.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function capture(values: InboxForm) {
    const response = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    if (!response.ok) {
      window.alert(t("inbox.captureError"));
      return;
    }
    reset({ type: "tarefa", title: "", content: "" });
    await load();
  }

  async function process(id: string, action: "task" | "project" | "note" | "discard") {
    await fetch(`/api/inbox/${id}/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    await load();
  }

  async function remove(id: string) {
    if (!window.confirm(t("inbox.deleteConfirm"))) return;
    await fetch(`/api/inbox/${id}`, { method: "DELETE" });
    await load();
  }

  const openItems = useMemo(() => items.filter((item) => item.status === "aberta"), [items]);
  const processedItems = useMemo(() => items.filter((item) => item.status !== "aberta"), [items]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("nav.inbox")}</h1>
        <p className="mt-1 text-sm text-muted">{t("inbox.subtitle")}</p>
      </div>

      <Card>
        <form className="grid gap-4 md:grid-cols-[180px_1fr]" onSubmit={handleSubmit(capture)}>
          <div className="space-y-1.5">
            <Label>{t("inbox.type")}</Label>
            <select className={inputClass} {...register("type")}>
              <option value="tarefa">{label("inboxType", "tarefa")}</option>
              <option value="ideia">{label("inboxType", "ideia")}</option>
              <option value="lembrete">{label("inboxType", "lembrete")}</option>
              <option value="anotacao">{label("inboxType", "anotacao")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>{t("common.title")}</Label>
            <input className={inputClass} {...register("title", { required: true })} />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>{t("inbox.content")}</Label>
            <textarea className={textareaClass} rows={3} {...register("content")} />
          </div>
          <Button className="w-fit md:col-span-2" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
            {t("inbox.capture")}
          </Button>
        </form>
      </Card>

      {loading ? <LoadingState /> : null}

      {!loading ? (
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">{t("inbox.toProcess")}</h2>
              <Badge className="bg-brand-50 text-brand-700">{openItems.length}</Badge>
            </div>
            {openItems.length ? (
              <div className="space-y-3">
                {openItems.map((item) => (
                  <InboxCard key={item.id} item={item} onProcess={process} onDelete={remove} />
                ))}
              </div>
            ) : (
              <EmptyState title={t("inbox.empty")} description={t("inbox.emptyDesc")} />
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-ink">{t("inbox.history")}</h2>
            {processedItems.length ? (
              <div className="space-y-3">
                {processedItems.map((item) => (
                  <div key={item.id} className="rounded-md border border-line p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-ink">{item.title}</p>
                      <Badge className={item.status === "descartada" ? "bg-red-50 text-red-700" : "bg-mint-50 text-mint-600"}>
                        {label("inboxStatus", item.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted">{label("inboxType", item.type)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{t("inbox.noHistory")}</p>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function InboxCard({
  item,
  onProcess,
  onDelete
}: {
  item: InboxItem;
  onProcess: (id: string, action: "task" | "project" | "note" | "discard") => void;
  onDelete: (id: string) => void;
}) {
  const { t, label } = useI18n();

  return (
    <div className="rounded-md border border-line p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <InboxIcon className="h-4 w-4 text-muted" />
            <p className="font-semibold text-ink">{item.title}</p>
          </div>
          {item.content ? <p className="mt-2 text-sm text-muted">{item.content}</p> : null}
        </div>
        <Badge className="bg-slate-100 text-slate-700">{label("inboxType", item.type)}</Badge>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => onProcess(item.id, "task")}>
          {t("inbox.task")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onProcess(item.id, "project")}>
          {t("inbox.project")}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => onProcess(item.id, "note")}>
          {t("inbox.note")}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onProcess(item.id, "discard")}>
          {t("common.discard")}
        </Button>
        <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>
          <Trash2 className="h-4 w-4" />
          {t("common.delete")}
        </Button>
      </div>
    </div>
  );
}
