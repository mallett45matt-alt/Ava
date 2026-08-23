import "server-only";

import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";

/**
 * Every server component/data function that touches business data should
 * call this first. It is the single choke point that guarantees we always
 * have a logged-in user's businessId before running any query — see
 * src/server/data/*.ts, which all start with `const session = await requireSession()`.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}
