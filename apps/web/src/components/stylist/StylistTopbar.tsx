"use client";

import { Bell, Search, Settings } from "lucide-react";

type Props = {
  user: {
    name?: string;
    email?: string;
    role?: string;
    stylistProfile?: {
      salon?: {
        name?: string;
      };
    };
  } | null;
};

export default function StylistTopbar({ user }: Props) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayName = user?.name || "Stylist";
  const salonName = user?.stylistProfile?.salon?.name || "Trimly";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0b1220] px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-white">
          Welcome back, {displayName}
        </h1>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      <div className="hidden w-[400px] items-center rounded-xl border border-white/10 bg-[#111827] px-3 py-2 md:flex">
        <Search size={16} className="mr-2 text-gray-400" />
        <input
          placeholder="Search appointments, clients..."
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

        <a className="flex cursor-pointer items-center gap-2" href="/stylist/profile">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#ABD5FF]/50 bg-gradient-to-br from-[#274b72] to-[#13213a] text-sm font-semibold text-[#ABD5FF] shadow-[0_0_15px_rgba(171,213,255,0.6)]">
            {initial}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-sm text-gray-300 leading-tight">{displayName}</span>
            <span className="text-xs text-gray-500 leading-tight">{salonName}</span>
          </div>
        </a>
      </div>
    </header>
  );
}