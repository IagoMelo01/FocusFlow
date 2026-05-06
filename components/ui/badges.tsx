"use client";

import clsx from "clsx";
import { useI18n } from "@/lib/i18n";

const priorityStyles = {
  baixa: "bg-slate-100 text-slate-700",
  media: "bg-blue-50 text-blue-700",
  alta: "bg-amber-50 text-amber-700",
  urgente: "bg-red-50 text-red-700"
};

const statusStyles = {
  inbox: "bg-slate-100 text-slate-700",
  a_fazer: "bg-blue-50 text-blue-700",
  fazendo: "bg-amber-50 text-amber-700",
  aguardando: "bg-violet-50 text-violet-700",
  concluida: "bg-mint-50 text-mint-600",
  cancelada: "bg-red-50 text-red-700"
};

export function Badge({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", className)}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: keyof typeof priorityStyles }) {
  const { label } = useI18n();
  return <Badge className={priorityStyles[priority]}>{label("priority", priority)}</Badge>;
}

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  const { label } = useI18n();
  return <Badge className={statusStyles[status]}>{label("status", status)}</Badge>;
}
