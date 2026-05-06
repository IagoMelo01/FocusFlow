import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/http";
import { registerSchema } from "@/lib/validations";
import { ApiError, SESSION_COOKIE, hashPassword, signSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const data = registerSchema.parse(await request.json());
    const existing = await prisma.user.findUnique({ where: { email: data.email } });

    if (existing) {
      throw new ApiError("A user with this email already exists.", 409);
    }

    const user = await prisma.user.create({
      data: {
        name: data.name || null,
        email: data.email,
        passwordHash: await hashPassword(data.password)
      }
    });

    const token = await signSession(user.id);
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      },
      { status: 201 }
    );

    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/"
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
