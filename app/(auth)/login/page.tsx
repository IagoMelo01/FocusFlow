"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorText, Label, inputClass } from "@/components/ui/form";
import { useI18n } from "@/lib/i18n";
import { loginSchema } from "@/lib/validations";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "admin@focusflow.local",
      password: "123456"
    }
  });

  async function onSubmit(values: LoginForm) {
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error || "Could not sign in.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-brand-600 text-white">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold text-ink">{t("auth.loginTitle")}</h1>
        <p className="mt-2 text-sm text-muted">{t("auth.loginSubtitle")}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label>{t("common.email")}</Label>
          <input className={inputClass} type="email" autoComplete="email" {...register("email")} />
          <ErrorText>{errors.email?.message}</ErrorText>
        </div>

        <div className="space-y-1.5">
          <Label>{t("common.password")}</Label>
          <input className={inputClass} type="password" autoComplete="current-password" {...register("password")} />
          <ErrorText>{errors.password?.message}</ErrorText>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("auth.loginLoading") : t("common.enter")}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link className="font-semibold text-brand-700" href="/register">
          {t("auth.createAccount")}
        </Link>
      </p>
    </Card>
  );
}
