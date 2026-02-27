import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await auth0.getSession();
  if (!session) redirect("/auth/login");

  return children;
}