"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorText, Label, inputClass } from "@/components/ui/form";
import { registerSchema } from "@/lib/validations";

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema)
  });

  async function onSubmit(values: RegisterForm) {
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(payload?.error || "Nao foi possivel cadastrar.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-mint-600 text-white">
          <UserPlus className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold text-ink">Criar conta</h1>
        <p className="mt-2 text-sm text-muted">Seus dados ficam isolados por usuario.</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <Label>Nome</Label>
          <input className={inputClass} autoComplete="name" {...register("name")} />
          <ErrorText>{errors.name?.message}</ErrorText>
        </div>

        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <input className={inputClass} type="email" autoComplete="email" {...register("email")} />
          <ErrorText>{errors.email?.message}</ErrorText>
        </div>

        <div className="space-y-1.5">
          <Label>Senha</Label>
          <input className={inputClass} type="password" autoComplete="new-password" {...register("password")} />
          <ErrorText>{errors.password?.message}</ErrorText>
        </div>

        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p> : null}

        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Ja tem conta?{" "}
        <Link className="font-semibold text-brand-700" href="/login">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
