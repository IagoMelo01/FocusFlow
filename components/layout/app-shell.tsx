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
import { useI18n } from "@/lib/i18n";

const navItems = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: Home },
  { href: "/meu-dia", labelKey: "nav.myDay", icon: CalendarCheck },
  { href: "/tarefas", labelKey: "nav.tasks", icon: ListTodo },
  { href: "/inbox", labelKey: "nav.inbox", icon: Inbox },
  { href: "/projetos", labelKey: "nav.projects", icon: ClipboardList },
  { href: "/habitos", labelKey: "nav.habits", icon: Sprout },
  { href: "/metas", labelKey: "nav.goals", icon: Goal },
  { href: "/foco", labelKey: "nav.focus", icon: Timer },
  { href: "/notas", labelKey: "nav.notes", icon: NotebookText },
  { href: "/revisao-semanal", labelKey: "nav.weeklyReview", icon: Target },
  { href: "/estatisticas", labelKey: "nav.statistics", icon: BarChart3 },
  { href: "/configuracoes", labelKey: "nav.settings", icon: Settings }
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
  const { language, setLanguage, t } = useI18n();

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
          <p className="text-xs text-muted">{t("app.subtitle")}</p>
        </div>
      </div>

      <div className="border-b border-line px-4 py-3">
        <label className="mb-1.5 block text-xs font-semibold uppercase text-muted">
          {t("common.language")}
        </label>
        <select
          className="h-9 w-full rounded-md border border-line bg-white px-3 text-sm font-medium text-ink outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          value={language}
          onChange={(event) => setLanguage(event.target.value === "pt" ? "pt" : "en")}
        >
          <option value="en">{t("common.english")}</option>
          <option value="pt">{t("common.portuguese")}</option>
        </select>
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
              {t(item.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-4">
        <div className="mb-3 min-w-0">
          <p className="truncate text-sm font-semibold text-ink">{user.name || t("common.user")}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Button variant="secondary" className="w-full" onClick={logout}>
          <LogOut className="h-4 w-4" />
          {t("common.logout")}
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-surface">
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex">{sidebar}</div>

      {open ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button className="flex-1 bg-slate-900/40" aria-label={t("common.closeMenu")} onClick={() => setOpen(false)} />
          <div className="w-72 max-w-[85vw]">{sidebar}</div>
        </div>
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:px-8">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-ink lg:hidden"
            onClick={() => setOpen(true)}
            aria-label={t("common.openMenu")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-muted">{t("common.localhost")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{user.name || t("common.user")}</p>
              <p className="text-xs text-muted">{user.email}</p>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-line bg-white text-muted hover:text-ink"
              onClick={logout}
              aria-label={t("common.logout")}
              title={t("common.logout")}
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
