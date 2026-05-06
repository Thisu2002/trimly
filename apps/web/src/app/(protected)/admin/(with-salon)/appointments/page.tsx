"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Search, CalendarDays, Clock3, Banknote } from "lucide-react";
import { toast } from "sonner";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;
  startTime: string;
  endTime: string;
  totalLkr: number;
  status: AppointmentStatus;
  services: {
    name: string;
    stylist: string;
    startTime: string;
    endTime: string;
    priceLkr: number;
  }[];
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "All" | AppointmentStatus
  >("All");

  async function fetchAppointments() {
    try {
      setLoading(true);
      const token = await getAccessToken();

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${apiBase}/api/appointment/salon?idToken=${token}`
      );
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const totalAppointments = appointments.length;
  const totalRevenue = appointments.reduce(
    (sum, a) => sum + a.totalLkr,
    0
  );
  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const q = search.toLowerCase();
      const matchesSearch =
        a.customerName.toLowerCase().includes(q) ||
        a.customerEmail.toLowerCase().includes(q) ||
        a.services.some((s) => s.name.toLowerCase().includes(q));

      const matchesStatus =
        filterStatus === "All" || a.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, filterStatus]);

  async function handleComplete(id: string) {
    setLoadingId(id);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

    const res = await fetch(`${apiBase}/api/appointment/${id}/complete`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Update UI immediately (no full reload needed)
    setAppointments((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, status: "completed" } : a
      )
    );
    toast.success("Appointment marked as completed!");

  } catch (err) {
    toast.error("Failed to mark appointment as completed.");
    console.error(err);
  } finally {
    setLoadingId(null);
  }
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-sm text-gray-400">
          Manage and track salon appointments
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Appointments" value={totalAppointments} />
        <StatCard title="Pending" value={pendingCount} />
        <StatCard title="Completed" value={completedCount} />
        <StatCard title="Revenue" value={`LKR ${totalRevenue.toLocaleString()}`} />
      </div>

      <div className="rounded-xl border border-gray-700 bg-[#111827] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by customer or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg bg-gray-800 px-4 py-2 pr-10 outline-none placeholder:text-gray-400"
            />
            <Search
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="flex gap-2">
            <FilterButton active={filterStatus === "All"} onClick={() => setFilterStatus("All")} label="All" />
            <FilterButton active={filterStatus === "pending"} onClick={() => setFilterStatus("pending")} label="Pending" />
            <FilterButton active={filterStatus === "confirmed"} onClick={() => setFilterStatus("confirmed")} label="Confirmed" />
            <FilterButton active={filterStatus === "completed"} onClick={() => setFilterStatus("completed")} label="Completed" />
            <FilterButton active={filterStatus === "cancelled"} onClick={() => setFilterStatus("cancelled")} label="Cancelled" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-400">Loading appointments...</div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-xl border border-gray-700 bg-[#111827] p-6 text-gray-400">
          No appointments found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredAppointments.map((appt) => (
  <AppointmentCard
    key={appt.id}
    appt={appt}
    onComplete={handleComplete}
    loadingId={loadingId}
  />
))}
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#111827] p-5 text-center">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm ${
        active ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function AppointmentCard({ appt, onComplete, loadingId }: { appt: Appointment; onComplete: (id: string) => void; loadingId: string | null; }) {
  return (
    <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{appt.customerName}</h3>
        <StatusBadge status={appt.status} />
      </div>

      <div className="mt-2 text-sm text-gray-400">{appt.customerEmail}</div>

      <div className="mt-4 space-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} /> {new Date(appt.date).toDateString()}
        </div>
        <div className="flex items-center gap-2">
          <Clock3 size={16} /> {appt.startTime} - {appt.endTime}
        </div>
        <div className="flex items-center gap-2">
          <Banknote size={16} /> LKR {appt.totalLkr.toLocaleString()}
        </div>
      </div>

      <div className="mt-4 border-t border-gray-700 pt-3">
        <div className="text-sm text-gray-400 mb-2">Services</div>
        <div className="space-y-1 text-sm">
          {appt.services.map((s, i) => (
            <div key={i} className="flex justify-between">
              <span>{s.name} • {s.stylist}</span>
              <span>LKR {s.priceLkr}</span>
            </div>
          ))}
        </div>
      </div>
      {/* ACTION BUTTON */}
      {appt.status === "confirmed" && (
        <button
          onClick={() => onComplete(appt.id)}
          className="mt-4 w-full rounded-lg bg-green-600 py-2 text-sm font-medium hover:bg-green-500"
          disabled={loadingId === appt.id}
        >
          {loadingId === appt.id ? "Updating..." : "Mark as Completed"}
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const styles = {
    pending: "bg-yellow-900/40 text-yellow-300",
    confirmed: "bg-blue-900/40 text-blue-300",
    completed: "bg-green-900/40 text-green-300",
    cancelled: "bg-red-900/40 text-red-300",
  };

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}