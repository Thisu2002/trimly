"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Search, CalendarDays, Clock3, Banknote, Scissors } from "lucide-react";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

type MyService = {
  name: string;
  startTime: string;
  endTime: string;
  priceLkr: number;
  durationMin: number;
};

type StylistAppointment = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  totalLkr: number;
  status: AppointmentStatus;
  customer: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  myServices: MyService[];
};

export default function StylistAppointmentsPage() {
  const [appointments, setAppointments] = useState<StylistAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | AppointmentStatus>("All");

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken();
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const res = await fetch(`${base}/api/stylist-dashboard/appointments?idToken=${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setAppointments(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalCount = appointments.length;
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;
  const totalRevenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((sum, a) => sum + a.myServices.reduce((s, sv) => s + sv.priceLkr, 0), 0);

  const filtered = useMemo(() => {
    return appointments.filter((a) => {
      const q = search.toLowerCase();
      const matchSearch =
        (a.customer.name ?? "").toLowerCase().includes(q) ||
        (a.customer.email ?? "").toLowerCase().includes(q) ||
        a.myServices.some((s) => s.name.toLowerCase().includes(q));
      const matchStatus = filterStatus === "All" || a.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [appointments, search, filterStatus]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Appointments</h1>
        <p className="text-sm text-gray-400">All appointments assigned to you</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard title="Total" value={totalCount} />
        <StatCard title="Pending" value={pendingCount} />
        <StatCard title="Completed" value={completedCount} />
        <StatCard title="My Revenue" value={`LKR ${totalRevenue.toLocaleString()}`} />
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by client or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-800 px-4 py-2 pr-10 text-sm text-white outline-none placeholder:text-gray-500"
            />
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["All", "pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-lg px-4 py-2 text-sm capitalize transition ${
                  filterStatus === s ? "bg-gray-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-gray-400 text-sm">Loading appointments...</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-[#111827] p-6 text-sm text-gray-400">
          No appointments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((appt) => (
            <AppointmentCard key={appt.id} appt={appt} />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5 text-center">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function AppointmentCard({ appt }: { appt: StylistAppointment }) {
  const myRevenue = appt.myServices.reduce((s, sv) => s + sv.priceLkr, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{appt.customer.name ?? "Unknown"}</h3>
        <StatusBadge status={appt.status} />
      </div>
      {appt.customer.email && (
        <div className="mt-1 text-sm text-gray-400">{appt.customer.email}</div>
      )}

      <div className="mt-4 space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <CalendarDays size={15} />
          {new Date(appt.date).toDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 size={15} />
          {appt.startTime} – {appt.endTime}
        </div>
        <div className="flex items-center gap-2">
          <Banknote size={15} />
          LKR {myRevenue.toLocaleString()}
          <span className="text-gray-500 text-xs">(my services)</span>
        </div>
      </div>

      <div className="mt-4 border-t border-white/10 pt-3">
        <div className="mb-2 text-xs text-gray-400 uppercase tracking-wider">My Services</div>
        <div className="space-y-1.5">
          {appt.myServices.map((s, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-gray-300">
                <Scissors size={13} className="text-gray-500" />
                {s.name}
                <span className="text-gray-500">{s.startTime}–{s.endTime}</span>
              </div>
              <span className="text-gray-400">LKR {s.priceLkr.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles: Record<AppointmentStatus, string> = {
    pending: "bg-yellow-900/40 text-yellow-300",
    confirmed: "bg-blue-900/40 text-blue-300",
    completed: "bg-green-900/40 text-green-300",
    cancelled: "bg-red-900/40 text-red-300",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}