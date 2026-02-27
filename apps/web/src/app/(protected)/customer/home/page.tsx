import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/app/api/getUser";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  const data = await getCurrentUser();
  if (data.role !== "customer") redirect("/admin/dashboard");

  return (
    <main style={{ padding: 24 }}>
      <h1>Home</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <a href="/auth/logout">Logout</a>
    </main>
  );
}