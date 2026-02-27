"use client";

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
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const displayName = user?.name || "User";
  const salonName = user?.adminSalon?.name || "Your Salon";
  const initial = salonName.charAt(0).toUpperCase();

  return (
    <header className="h-16 border-b border-white/10 bg-[#0b1220] px-6 flex items-center justify-between">
      
      {/* LEFT */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-white">
          Welcome back, {displayName}
        </h1>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      {/* CENTER */}
      <div className="hidden md:flex items-center bg-[#111827] border border-white/10 rounded-xl px-3 py-2 w-[400px]">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          placeholder="Search clients, bookings..."
          className="bg-transparent outline-none text-sm text-white w-full placeholder:text-gray-500"
        />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-white transition">
          <Bell size={18} />
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button className="text-gray-400 hover:text-white transition">
          <Settings size={18} />
        </button>

        <div className="h-6 w-px bg-white/10" />

        {/* Profile */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-semibold">
            {initial}
          </div>
          <span className="text-sm text-gray-300 hidden sm:block">
            {salonName}
          </span>
        </div>
      </div>
    </header>
  );
}