"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Settings } from "lucide-react";

type Props = {
  user: {
    name?: string;
    email?: string;
    role?: string;
    adminSalon?: {
      name?: string;
    };
  } | null;
};

export default function Topbar({ user }: Props) {
  const [today] = useState(() =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
);

  const displayName = user?.name || "User";
  const salonName = user?.adminSalon?.name || "Your Salon";
  const initial = salonName.charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0b1220] px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-white">
          Welcome back, {displayName}
        </h1>
        <span className="text-xs text-gray-400">
          {today || "\u00A0"}
        </span>
      </div>

      <div className="hidden w-[400px] items-center rounded-xl border border-white/10 bg-[#111827] px-3 py-2 md:flex">
        <Search size={16} className="mr-2 text-gray-400" />
        <input
          placeholder="Search clients, bookings..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 transition hover:text-white">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button className="text-gray-400 transition hover:text-white">
          <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-white/10" />

        <div className="flex cursor-pointer items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ABD5FF]/50 bg-gradient-to-br from-[#274b72] to-[#13213a] text-sm font-semibold text-[#ABD5FF] shadow-[0_0_15px_rgba(171,213,255,0.6)]">
            {initial}
          </div>
          <span className="hidden text-sm text-gray-300 sm:block">
            {salonName}
          </span>
        </div>
      </div>
    </header>
  );
}