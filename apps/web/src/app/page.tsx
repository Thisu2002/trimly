import { redirect } from "next/navigation";
import { auth0 } from "@/lib/auth0";
import { getCurrentUser } from "@/app/api/getUser";

export default async function Page() {
  const session = await auth0.getSession();

  if (!session) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Trimly</h1>
        <p><a href="/auth/login">Log in</a></p>
        <p><a href="/signup">Sign up</a></p>
      </main>
    );
  }

  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");

  if (user.role === "customer") {
    redirect("/customer/home");
  } else {
    redirect("/admin/dashboard");
  }
}