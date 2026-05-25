"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Scissors, 
  Wrench, 
  Boxes, 
  BarChart3, 
  Gift, 
  Clock, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const mainNav = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Appointments", href: "/admin/appointments", icon: CalendarDays },
  { name: "Staff Management", href: "/admin/stylists", icon: Scissors }, 
  { name: "Services", href: "/admin/services", icon: Wrench },           
  { name: "Inventory", href: "/admin/inventory", icon: Boxes },            
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { name: "Loyalty Program", href: "/admin/loyalty", icon: Gift },
  { name: "Business Hours", href: "/admin/business-hours", icon: Clock },
];

const logoutItem = { name: "Logout", href: "/auth/logout", icon: LogOut };

export default function Sidebar() {
  const pathname = usePathname();
  // 1. Manage the expanded/collapsed state
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside 
      className={`h-screen bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] border-r border-white/10 p-4 flex flex-col justify-between relative transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-20" : "w-64"}`}
    >
      {/* 2. Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 bg-[#0f1b33] border border-white/10 text-slate-300 rounded-full p-1 hover:text-white transition shadow-md z-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
      
      {/* Top Section */}
      <div>
        {/* Logo container adapts its layout based on collapse state */}
        <div className={`mb-6 flex ${isCollapsed ? "justify-center" : "justify-start pl-2"}`}>
          {isCollapsed ? (
            <Image
              src="/t_logo.png"
              alt="Trimly Logo"
              width={18}
              height={10}
              priority
            />
          ) : (
            <Image
              src="/logo_cropped.png"
              alt="Trimly Logo"
              width={100}
              height={20}
              priority
            />
          )}
        </div>

        <nav className="flex flex-col gap-2">
          {mainNav.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                title={isCollapsed ? item.name : undefined} // Native tooltip on hover when collapsed
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all group
                ${isCollapsed ? "justify-center" : "justify-start"}
                ${isActive ? "bg-brand/20 text-white shadow-brand" : "hover:bg-slate-800 text-slate-300"}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {/* 3. Smoothly hide text when collapsed */}
                <span 
                  className={`text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap
                    ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"}`}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div>
        <Link
          href={logoutItem.href}
          title={isCollapsed ? logoutItem.name : undefined}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition group mt-auto
          ${isCollapsed ? "justify-center" : "justify-start"}`}
        >
          <logoutItem.icon className="h-5 w-5 shrink-0" />
          <span 
            className={`text-sm font-medium transition-all duration-200 overflow-hidden whitespace-nowrap
              ${isCollapsed ? "w-0 opacity-0 pointer-events-none" : "w-auto opacity-100"}`}
          >
            {logoutItem.name}
          </span>
        </Link>
      </div>

    </aside>
  );
}
