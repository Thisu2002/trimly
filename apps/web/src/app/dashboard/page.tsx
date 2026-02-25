import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/lib/getUser";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const data = await getCurrentUser();
  if (data.role !== "admin") redirect("/home");

  return (
    <main style={{ padding: 24 }}>
      <h1>Dashboard</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <a href="/auth/logout">Logout</a>
    </main>
  );
}