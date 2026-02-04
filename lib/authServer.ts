import { headers } from "next/headers";
import { adminAuth } from "./firebaseAdmin";

export type AuthenticatedUser = {
  uid: string;
  email: string | null;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  const hdrs = await headers();
  const authHeader = hdrs.get("authorization") || hdrs.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
    };
  } catch {
    throw new Response("Unauthorized", { status: 401 });
  }
}

