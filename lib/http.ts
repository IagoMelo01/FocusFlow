import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function empty() {
  return new NextResponse(null, { status: 204 });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Dados invalidos.",
        issues: error.flatten()
      },
      { status: 422 }
    );
  }

  console.error(error);
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}
