import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
      <Inbox className="h-9 w-9 text-slate-300" />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted">{description}</p> : null}
    </div>
  );
}

export function LoadingState({ label = "Carregando dados..." }: { label?: string }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6 text-sm font-medium text-muted">
      {label}
    </div>
  );
}
