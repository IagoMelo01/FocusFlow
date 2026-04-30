"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarCheck,
  ClipboardList,
  Focus,
  Goal,
  Home,
  Inbox,
  ListTodo,
  LogOut,
  Menu,
  NotebookText,
  Settings,
  Sprout,
  Target,
  Timer,
} from "lucide-react";
import clsx from "clsx";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/meu-dia", label: "Meu Dia", icon: CalendarCheck },
  { href: "/tarefas", label: "Tarefas", icon: ListTodo },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/projetos", label: "Projetos", icon: ClipboardList },
  { href: "/habitos", label: "Habitos", icon: Sprout },
  { href: "/metas", label: "Metas", icon: Goal },
  { href: "/foco", label: "Foco", icon: Timer },
  { href: "/notas", label: "Notas", icon: NotebookText },
  { href: "/revisao-semanal", label: "Revisao Semanal", icon: Target },
  { href: "/estatisticas", label: "Estatisticas", icon: BarChart3 },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings }
];

export function AppShell({
  children,
  user
}: {
  children: React.ReactNode;
  user: { name: string | null; email: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const sidebar = (
    <aside className="flex h-full w-72 flex-col border-r border-line bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-line px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-600 text-white">
          <Focus className="h-5 w-5" />
        </div>
        <div>
          <p className="text-lg font-semibold text-ink">FocusFlow</p>
          <p className="text-xs text-muted">GTD, Kanban e foco</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50 hover:text-ink"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="mb-3 min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user.name || "Usuario"}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Button variant="secondary" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>

      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="flex-1 bg-slate-900/40" aria-label="Fechar menu" onClick={() => setOpen(false)} />
          <div className="w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:px-8">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-muted">Localhost</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{user.name || "Usuario"}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted hover:text-ink"
              onClick={logout}
              aria-label="Sair"
              title="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
