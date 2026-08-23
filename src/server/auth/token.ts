// Pure token signing/verification, with no dependency on `next/headers`.
// Kept separate from session.ts so it can be safely imported from
// middleware.ts, which runs in the Edge runtime.

import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "ava_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

export type SessionPayload = {
  userId: string;
  businessId: string;
  businessName: string;
  role: UserRole;
  name: string;
  email: string;
};

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Set a long random value in your .env file.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.businessId === "string" &&
      typeof payload.businessName === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        userId: payload.userId,
        businessId: payload.businessId,
        businessName: payload.businessName,
        role: payload.role as UserRole,
        name: payload.name,
        email: payload.email,
      };
    }
    return null;
  } catch {
    return null;
  }
}
