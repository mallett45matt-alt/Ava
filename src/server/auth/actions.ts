"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db/client";
import { hashPassword, verifyPassword } from "./password";
import { setSessionCookie, clearSessionCookie } from "./session";

export type AuthActionState = { error: string } | null;

const signUpSchema = z.object({
  businessName: z.string().trim().min(2, "Enter your business name."),
  name: z.string().trim().min(2, "Enter your name."),
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    businessName: formData.get("businessName"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { businessName, name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with that email already exists." };
  }

  const passwordHash = await hashPassword(password);

  const { business, user } = await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({ data: { name: businessName } });
    const user = await tx.user.create({
      data: {
        businessId: business.id,
        name,
        email,
        passwordHash,
        role: "OWNER",
      },
    });
    return { business, user };
  });

  await setSessionCookie({
    userId: user.id,
    businessId: business.id,
    businessName: business.name,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

const logInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export async function logIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = logInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { business: true },
  });
  // Compare against a dummy hash even when no user exists, so the response
  // time doesn't reveal whether an email address is registered.
  const passwordMatches = await verifyPassword(
    password,
    user?.passwordHash ?? "$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsaltinu",
  );

  if (!user || !passwordMatches) {
    return { error: "Incorrect email or password." };
  }

  await setSessionCookie({
    userId: user.id,
    businessId: user.businessId,
    businessName: user.business.name,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  redirect("/dashboard");
}

export async function logOut() {
  await clearSessionCookie();
  redirect("/login");
}
