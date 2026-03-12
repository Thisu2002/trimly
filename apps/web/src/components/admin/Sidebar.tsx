"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const nav = [
  { name: "Dashboard", href: "/admin/dashboard" },
  { name: "Appointments", href: "/admin/appointments" },
  { name: "Staff Management", href: "/admin/stylists" },
  { name: "Services", href: "/admin/services" },
  { name: "Inventory", href: "/admin/inventory" },
  { name: "Analytics", href: "/admin/analytics" },
  { name: "Loyalty Program", href: "/admin/loyalty" },
  { name: "Business Hours", href: "/admin/business-hours" },
  { name: "Logout", href: "/auth/logout" }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 p-5">
      <div className="mb-6 flex justify-center">
        <Image
          src="/logo_cropped.png"
          alt="Trimly Logo"
          width={120}
          height={40}
          priority
        />
      </div>

      <nav className="flex flex-col gap-2">
        {nav.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`block px-4 py-2 rounded-lg transition
              ${isActive ? "bg-brand/20 text-white shadow-brand" : "hover:bg-slate-800 text-slate-300"}`}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}