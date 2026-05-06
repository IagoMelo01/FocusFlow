import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "focusflow_session";

type SessionPayload = {
  sub: string;
};

function getJwtSecret() {
  const secret = process.env.JWT_SECRET || "focusflow-local-development-secret";
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signSession(userId: string) {
  return new SignJWT({ sub: userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifySession(token?: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);

  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new ApiError("Session expired or user not authenticated.", 401);
  }
  return user;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}
