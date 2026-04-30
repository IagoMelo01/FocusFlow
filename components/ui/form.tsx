import clsx from "clsx";

export function Label({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <label className={clsx("text-sm font-medium text-ink", className)}>{children}</label>;
}

export const inputClass =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const textareaClass =
  "min-h-24 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="text-xs font-medium text-red-600">{children}</p>;
}
