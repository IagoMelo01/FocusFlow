"use client";

import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingState } from "@/components/ui/empty-state";
import { useI18n } from "@/lib/i18n";

type User = {
  name?: string | null;
  email: string;
  createdAt: string;
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const { t } = useI18n();

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/auth/me");
      const payload = await response.json();
      setUser(payload.user);
    }
    load();
  }, []);

  if (!user) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{t("nav.settings")}</h1>
        <p className="mt-1 text-sm text-muted">{t("settings.subtitle")}</p>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <div className="rounded-md bg-mint-50 p-3 text-mint-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-ink">{user.name || t("common.user")}</h2>
            <p className="mt-1 text-sm text-muted">{user.email}</p>
            <p className="mt-3 text-sm text-muted">
              {t("settings.authInfo")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
