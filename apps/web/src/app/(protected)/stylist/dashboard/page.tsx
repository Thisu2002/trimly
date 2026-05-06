"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Banknote,
  TrendingUp,
  Scissors,
} from "lucide-react";

type Stats = {
  todayAppointments: number;
  upcomingAppointments: number;
  monthCompletedServices: number;
  monthRevenueLkr: number;
  totalCompletedServices: number;
};

type TodaySlot = {
  serviceName: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string | null;
  appointmentStatus: string;
};

export default function StylistDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<TodaySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken();
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;

        const [statsRes, scheduleRes] = await Promise.all([
          fetch(`${base}/api/stylist-dashboard/stats?idToken=${token}`),
          fetch(`${base}/api/stylist-dashboard/schedule?idToken=${token}`),
        ]);

        const statsData = await statsRes.json();
        const scheduleData = await scheduleRes.json();

        setStats(statsData);
        setTodaySchedule(scheduleData.todaySchedule ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="text-gray-400">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-400">Your overview for today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<CalendarDays size={20} />}
          label="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          accent="blue"
        />
        <StatCard
          icon={<Clock3 size={20} />}
          label="Upcoming"
          value={stats?.upcomingAppointments ?? 0}
          accent="yellow"
        />
        <StatCard
          icon={<CheckCircle2 size={20} />}
          label="Completed This Month"
          value={stats?.monthCompletedServices ?? 0}
          accent="green"
        />
        <StatCard
          icon={<Banknote size={20} />}
          label="Revenue This Month"
          value={`LKR ${(stats?.monthRevenueLkr ?? 0).toLocaleString()}`}
          accent="purple"
        />
      </div>

      {/* Career stat */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-[#111827] p-5 flex items-center gap-4">
          <div className="rounded-lg bg-[#1d2a3a] p-3 text-[#ABD5FF]">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-sm text-gray-400">Total Services Completed</div>
            <div className="text-2xl font-semibold mt-0.5">
              {stats?.totalCompletedServices ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Today's schedule */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Today&apos;s Schedule</h2>
        {todaySchedule.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6 text-gray-400 text-sm">
            No appointments scheduled for today.
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((slot, i) => (
              <TodaySlotCard key={i} slot={slot} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent: "blue" | "yellow" | "green" | "purple";
}) {
  const accentMap = {
    blue: "text-blue-300 bg-blue-900/20",
    yellow: "text-yellow-300 bg-yellow-900/20",
    green: "text-green-300 bg-green-900/20",
    purple: "text-purple-300 bg-purple-900/20",
  };

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${accentMap[accent]}`}>
        {icon}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function TodaySlotCard({ slot }: { slot: TodaySlot }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111827] p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ABD5FF]/30 bg-gradient-to-br from-[#274b72] to-[#13213a] text-[#ABD5FF]">
        <Scissors size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{slot.serviceName}</div>
        <div className="text-sm text-gray-400 truncate">
          {slot.customerName}
          {slot.customerPhone ? ` · ${slot.customerPhone}` : ""}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm text-white">
          {slot.startTime} – {slot.endTime}
        </div>
        <StatusPill status={slot.appointmentStatus} />
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-900/40 text-yellow-300",
    confirmed: "bg-blue-900/40 text-blue-300",
    completed: "bg-green-900/40 text-green-300",
    cancelled: "bg-red-900/40 text-red-300",
  };
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? "bg-gray-700 text-gray-300"}`}
    >
      {status}
    </span>
  );
}