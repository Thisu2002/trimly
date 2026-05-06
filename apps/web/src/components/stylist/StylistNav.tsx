"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { name: "Dashboard", href: "/stylist/dashboard" },
  { name: "Appointments", href: "/stylist/appointments" },
  { name: "Schedule", href: "/stylist/schedule" },
  { name: "My Profile", href: "/stylist/profile" },
  { name: "Logout", href: "/auth/logout" },
];

export default function StylistNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-white/10 bg-[#0b1220] px-6">
      {NAV.map((item) => {
        const isActive = pathname.startsWith(item.href) && item.href !== "/auth/logout";
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`-mb-px border-b-2 px-4 py-3 text-sm font-medium transition ${
              isActive
                ? "border-[#ABD5FF] text-white"
                : "border-transparent text-slate-400 hover:border-slate-600 hover:text-white"
            }`}
          >
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}