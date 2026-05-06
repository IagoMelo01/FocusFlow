"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label, inputClass } from "@/components/ui/form";
import type { TaskDTO } from "@/lib/client-types";
import { useI18n } from "@/lib/i18n";

const modes = {
  pomodoro: { labelKey: "focus.pomodoro", minutes: 25 },
  short: { labelKey: "focus.shortBreak", minutes: 5 },
  long: { labelKey: "focus.longBreak", minutes: 15 }
} as const;

type Mode = keyof typeof modes;
type SessionDTO = {
  id: string;
  durationMinutes: number;
  status: "concluida" | "interrompida";
  startedAt: string;
  task?: TaskDTO | null;
};

export default function FocusPage() {
  const [mode, setMode] = useState<Mode>("pomodoro");
  const [secondsLeft, setSecondsLeft] = useState(modes.pomodoro.minutes * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [taskId, setTaskId] = useState("");
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [sessions, setSessions] = useState<SessionDTO[]>([]);
  const recordedRef = useRef(false);
  const { t, label } = useI18n();

  async function load() {
    const [taskResponse, sessionResponse] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/focus-sessions")
    ]);
    const taskPayload = await taskResponse.json();
    const sessionPayload = await sessionResponse.json();
    setTasks((taskPayload.tasks ?? []).filter((task: TaskDTO) => task.status !== "concluida" && task.status !== "cancelada"));
    setSessions(sessionPayload.sessions ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSecondsLeft(modes[mode].minutes * 60);
    setRunning(false);
    setStartedAt(null);
    recordedRef.current = false;
  }, [mode]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (secondsLeft === 0 && running && !recordedRef.current) {
      recordedRef.current = true;
      setRunning(false);
      recordSession("concluida");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  const elapsedMinutes = useMemo(() => Math.max(1, Math.ceil((modes[mode].minutes * 60 - secondsLeft) / 60)), [mode, secondsLeft]);
  const minutes = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
  const seconds = (secondsLeft % 60).toString().padStart(2, "0");

  function start() {
    if (!startedAt) setStartedAt(new Date());
    setRunning(true);
  }

  function reset() {
    setRunning(false);
    setStartedAt(null);
    setSecondsLeft(modes[mode].minutes * 60);
    recordedRef.current = false;
  }

  async function recordSession(status: "concluida" | "interrompida") {
    const start = startedAt ?? new Date();
    await fetch("/api/focus-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: taskId || null,
        startedAt: start.toISOString(),
        endedAt: new Date().toISOString(),
        durationMinutes: status === "concluida" ? modes[mode].minutes : elapsedMinutes,
        status
      })
    });
    reset();
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("nav.focus")}</h1>
        <p className="mt-1 text-sm text-muted">{t("focus.subtitle")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Card>
          <div className="mb-6 flex flex-wrap gap-2">
            {(Object.keys(modes) as Mode[]).map((item) => (
              <button
                key={item}
                className={`h-10 rounded-md border px-4 text-sm font-medium ${mode === item ? "border-brand-600 bg-brand-600 text-white" : "border-line bg-white text-ink hover:bg-brand-50"}`}
                onClick={() => setMode(item)}
              >
                {t(modes[item].labelKey)}
              </button>
            ))}
          </div>

          <div className="mb-6 space-y-1.5">
            <Label>{t("focus.taskInFocus")}</Label>
            <select className={inputClass} value={taskId} onChange={(event) => setTaskId(event.target.value)}>
              <option value="">{t("focus.noTask")}</option>
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col items-center rounded-lg border border-line bg-slate-50 p-8">
            <p className="text-sm font-semibold text-muted">{t(modes[mode].labelKey)}</p>
            <div className="mt-4 tabular-nums text-7xl font-semibold tracking-normal text-ink">{minutes}:{seconds}</div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {!running ? (
                <Button type="button" onClick={start}>
                  <Play className="h-4 w-4" />
                  {t("focus.start")}
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={() => setRunning(false)}>
                  <Pause className="h-4 w-4" />
                  {t("focus.pause")}
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                {t("focus.reset")}
              </Button>
              <Button type="button" variant="danger" disabled={!startedAt} onClick={() => recordSession("interrompida")}>
                <Square className="h-4 w-4" />
                {t("focus.interrupt")}
              </Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-semibold text-ink">{t("focus.recent")}</h2>
          {sessions.length ? (
            <div className="space-y-3">
              {sessions.slice(0, 12).map((session) => (
                <div key={session.id} className="rounded-md border border-line p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-ink">{session.task?.title || t("focus.free")}</p>
                    <span className="text-sm font-semibold text-brand-700">{session.durationMinutes} min</span>
                  </div>
                  <p className="mt-1 text-xs text-muted">{label("focusStatus", session.status)} - {new Date(session.startedAt).toLocaleString("pt-BR")}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t("focus.noSessions")} />
          )}
        </Card>
      </div>
    </div>
  );
}
