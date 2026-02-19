import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { jwtDecode } from "jwt-decode";

const ROLE_CLAIM = "https://trimly.app/roles";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const idToken = session.tokenSet?.idToken;
  type IdTokenPayload = {
    [key: string]: unknown;
  };

  const payload: IdTokenPayload = idToken ? jwtDecode<IdTokenPayload>(idToken) : {};

  const roles = payload[ROLE_CLAIM];

  const isAdmin = Array.isArray(roles) && roles.includes("admin");
  if (!isAdmin) redirect("/home");

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin Dashboard</h1>
      <pre>{JSON.stringify(session.user, null, 2)}</pre>
      <a href="/auth/logout">Logout</a>
    </main>
  );
}
