import { auth0 } from "@/lib/auth0";

export async function getCurrentUser() {
  const session = await auth0.getSession();
  if (!session) return null;

  const idToken = session.tokenSet?.idToken;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const res = await fetch(`${apiBase}/auth/me`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    cache: "no-store",
  });

  const { user } = await res.json();
  //console.log("DB User:", user);
  return user;
}