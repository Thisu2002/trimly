//D:\trimly\apps\web\src\components\stylist\StylistTopbar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, LogOut } from "lucide-react";
import Image from "next/image";

type Props = {
  user: {
    name?: string;
    email?: string;
    role?: string;
    photo?: string | null;
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
  const photo = user?.photo;

  const [menuOpen, setMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between border-b border-white/10 bg-[#0b1220] px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-white">
          Welcome back, {displayName}
        </h1>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      <div className="flex items-center gap-4">
        {/* <button className="relative text-gray-400 transition hover:text-white">
          <Bell size={18} />
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <button className="text-gray-400 transition hover:text-white">
          <Settings size={18} />
        </button> */}

        <div className="h-6 w-px bg-white/10" />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex cursor-pointer items-center gap-2"
          >
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#ABD5FF]/50 bg-gradient-to-br from-[#274b72] to-[#13213a] text-sm font-semibold text-[#ABD5FF] shadow-[0_0_15px_rgba(171,213,255,0.6)]">
              {photo ? (
                <Image
                  src={photo}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm text-gray-300 leading-tight">
                {displayName}
              </span>
              <span className="text-xs text-gray-500 leading-tight">
                {salonName}
              </span>
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-xl border border-gray-700 bg-[#111827] shadow-xl shadow-black/40">
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <div className="px-4 py-3">
                  <p className="mb-2 text-xs text-gray-400">
                    Log out of Trimly?
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirming(false)}
                      className="flex-1 rounded-lg border border-gray-700 px-2 py-1.5 text-xs text-gray-300 transition hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <a
                      href="/auth/logout"
                      className="flex-1 rounded-lg bg-red-500/90 px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-red-500"
                    >
                      Confirm
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
