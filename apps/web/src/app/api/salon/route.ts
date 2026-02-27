import { auth0 } from "@/lib/auth0";

export async function POST(req: Request) {
  const session = await auth0.getSession();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const idToken = session.tokenSet?.idToken;
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

  const body = await req.json();

  const res = await fetch(`${apiBase}/api/salon`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idToken,
      ...body,
    }),
  });

  const data = await res.json().catch(() => ({ error: "Unknown error" }));

  return Response.json(data, { status: res.status });
}
