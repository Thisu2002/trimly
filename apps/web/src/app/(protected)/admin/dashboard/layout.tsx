import Sidebar from "@/components/admin/Sidebar";
import Topbar from "@/components/admin/Topbar";
import { ReactNode } from "react";
import { getCurrentUser } from "@/app/api/getUser";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  //console.log("AdminLayout user:", user);
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  if (!user.adminSalon) {
    redirect("/admin/create-salon");
  }

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <main className="p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}