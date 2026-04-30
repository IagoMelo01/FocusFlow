import clsx from "clsx";

export function Card({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={clsx("rounded-lg border border-line bg-white p-5 shadow-card", className)}>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: React.ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-muted">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
        {detail ? <p className="mt-1 text-sm text-muted">{detail}</p> : null}
      </div>
      {icon ? <div className="rounded-md bg-brand-50 p-2 text-brand-700">{icon}</div> : null}
    </Card>
  );
}
