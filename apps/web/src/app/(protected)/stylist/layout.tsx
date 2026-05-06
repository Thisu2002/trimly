import StylistTopbar from "@/components/stylist/StylistTopbar";
import StylistNav from "@/components/stylist/StylistNav";
import { ReactNode } from "react";
import { getCurrentUser } from "@/app/api/getUser";
import { redirect } from "next/navigation";

export default async function StylistLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) redirect("/auth/login");
  if (user.role === "admin") redirect("/admin/dashboard");
  if (user.role === "customer") redirect("/");
  if (user.role !== "stylist") redirect("/");

  return (
    <div className="flex h-screen flex-col bg-[#0b1220] text-white">
      <StylistTopbar user={user} />
      <StylistNav />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}