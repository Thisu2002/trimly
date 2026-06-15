"use client";

// D:\trimly\apps\web\src\app\(protected)\admin\(with-salon)\dashboard\page.tsx

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import {
  CalendarDays,
  Users,
  Package,
  TrendingUp,
  Clock3,
  Star,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Banknote,
  Gift,
} from "lucide-react";
import Link from "next/link";
import type {
  RecentAppointment,
  InventoryItem,
  Stylist,
  LoyaltyStats,
} from "@/types";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

type DashboardData = {
  appointments: RecentAppointment[];
  inventoryItems: InventoryItem[];
  stylists: Stylist[];
  loyaltyStats: LoyaltyStats;
};

function getStockStatus(item: InventoryItem) {
  if (item.currentStock < item.minStock * 0.5) return "critical";
  if (item.currentStock < item.minStock) return "low";
  return "good";
}

const STATUS_BADGE: Record<
  AppointmentStatus,
  { label: string; cls: string }
> = {
  pending:   { label: "Pending",   cls: "bg-yellow-900/40 text-yellow-300" },
  confirmed: { label: "Confirmed", cls: "bg-blue-900/40 text-blue-300"     },
  completed: { label: "Completed", cls: "bg-green-900/40 text-green-300"   },
  cancelled: { label: "Cancelled", cls: "bg-red-900/40 text-red-300"       },
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [salonName, setSalonName] = useState<string>("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const token = await getAccessToken();
        const api = process.env.NEXT_PUBLIC_API_BASE_URL!;

        const [apptRes, invRes, stylistRes, loyaltyRes, salonRes] =
          await Promise.all([
            fetch(`${api}/api/appointment/salon?idToken=${token}`),
            fetch(`${api}/api/inventory/items?idToken=${token}`),
            fetch(`${api}/api/stylist/list?idToken=${token}`),
            fetch(`${api}/api/loyalty/stats?idToken=${token}`),
            fetch(`${api}/api/salon/me?idToken=${token}`),
          ]);

        const [appointments, inventoryItems, stylists, loyaltyStats, salon] =
          await Promise.all([
            apptRes.json(),
            invRes.json(),
            stylistRes.json(),
            loyaltyRes.json(),
            salonRes.json(),
          ]);

        setSalonName(salon?.name ?? "");
        setData({
          appointments: Array.isArray(appointments) ? appointments : [],
          inventoryItems: Array.isArray(inventoryItems) ? inventoryItems : [],
          stylists: Array.isArray(stylists) ? stylists : [],
          loyaltyStats: loyaltyStats ?? {
            totalMembers: 0,
            activeMembers: 0,
            pointsIssued: 0,
            rewardsRedeemed: 0,
          },
        });
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-gray-400 text-sm">
        Loading dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-60 items-center justify-center text-gray-400 text-sm">
        Failed to load dashboard.
      </div>
    );
  }

  const { appointments, inventoryItems, stylists, loyaltyStats } = data;

  // ── Derived stats ────────────────────────────────────────────────────────

  const totalRevenue = appointments
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + a.totalLkr, 0);

  const pendingCount   = appointments.filter((a) => a.status === "pending").length;
  const confirmedCount = appointments.filter((a) => a.status === "confirmed").length;
  const completedCount = appointments.filter((a) => a.status === "completed").length;

  const onDutyCount = stylists.filter((s) => s.status === "on_duty").length;

  const criticalItems = inventoryItems.filter(
    (i) => getStockStatus(i) === "critical"
  );
  const lowItems = inventoryItems.filter((i) => getStockStatus(i) === "low");

  // Recent 5 appointments
  const recentAppointments = [...appointments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Today's appointments
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayAppointments = appointments.filter(
    (a) => a.date.slice(0, 10) === todayStr && a.status !== "cancelled"
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            {salonName ? `${salonName}` : "Dashboard"}
          </h1>
          <p className="text-sm text-gray-400">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick alert badge */}
        {(criticalItems.length > 0 || pendingCount > 0) && (
          <div className="flex items-center gap-2 rounded-lg border border-yellow-700/50 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-300">
            <AlertTriangle size={15} />
            {criticalItems.length > 0
              ? `${criticalItems.length} item${criticalItems.length > 1 ? "s" : ""} critically low`
              : `${pendingCount} pending appointment${pendingCount > 1 ? "s" : ""}`}
          </div>
        )}
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard
          icon={<Banknote size={18} className="text-[#abd5ff]" />}
          label="Revenue"
          value={`LKR ${totalRevenue.toLocaleString()}`}
          sub="from completed"
          accent
        />
        <KpiCard
          icon={<CalendarDays size={18} className="text-gray-400" />}
          label="Appointments"
          value={appointments.length}
          sub={`${pendingCount} pending · ${confirmedCount} confirmed`}
        />
        <KpiCard
          icon={<Users size={18} className="text-gray-400" />}
          label="Staff"
          value={stylists.length}
          sub={`${onDutyCount} on duty today`}
        />
        <KpiCard
          icon={<Gift size={18} className="text-gray-400" />}
          label="Loyalty Members"
          value={loyaltyStats.totalMembers}
          sub={`${loyaltyStats.activeMembers} active`}
        />
      </div>

      {/* Two-column middle row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Today's schedule — 2/3 width */}
        <div className="xl:col-span-2 rounded-xl border border-gray-700 bg-[#111827] p-5">
          <SectionHeader
            icon={<Clock3 size={16} />}
            title="Today's Appointments"
            count={todayAppointments.length}
            href="/admin/appointments"
          />

          {todayAppointments.length === 0 ? (
            <EmptyState icon={<CalendarDays size={28} />} label="No appointments today" />
          ) : (
            <div className="mt-3 space-y-2">
              {todayAppointments.slice(0, 6).map((appt) => {
                const badge = STATUS_BADGE[appt.status];
                return (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-700/60 bg-[#0f172a] px-4 py-2.5"
                  >
                    <div className="min-w-[80px] text-xs text-gray-400">
                      {appt.startTime} – {appt.endTime}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {appt.customerName}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {appt.services.map((s) => s.name).join(", ")}
                      </p>
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap">
                      LKR {appt.totalLkr.toLocaleString()}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Staff status — 1/3 width */}
        <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
          <SectionHeader
            icon={<Users size={16} />}
            title="Staff Status"
            count={stylists.length}
            href="/admin/stylists"
          />
          {stylists.length === 0 ? (
            <EmptyState icon={<Users size={28} />} label="No staff added yet" />
          ) : (
            <div className="mt-3 space-y-2">
              {stylists.slice(0, 7).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-700/60 bg-[#0f172a] px-3 py-2"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gray-600 text-xs font-medium">
                    {s.user.name
                      .split(" ")
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <p className="flex-1 truncate text-sm">{s.user.name}</p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      s.status === "on_duty"
                        ? "bg-green-900/40 text-green-300"
                        : "bg-yellow-900/40 text-yellow-300"
                    }`}
                  >
                    {s.status === "on_duty" ? "On Duty" : "Leave"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Recent appointments — 2/3 */}
        <div className="xl:col-span-2 rounded-xl border border-gray-700 bg-[#111827] p-5">
          <SectionHeader
            icon={<TrendingUp size={16} />}
            title="Recent Appointments"
            href="/admin/appointments"
          />
          {recentAppointments.length === 0 ? (
            <EmptyState icon={<CalendarDays size={28} />} label="No appointments yet" />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 text-left text-xs text-gray-500">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Services</th>
                    <th className="pb-2 font-medium text-right">Amount</th>
                    <th className="pb-2 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {recentAppointments.map((appt) => {
                    const badge = STATUS_BADGE[appt.status];
                    return (
                      <tr key={appt.id}>
                        <td className="py-2.5 font-medium">{appt.customerName}</td>
                        <td className="py-2.5 text-gray-400">
                          {new Date(appt.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        <td className="py-2.5 text-gray-400 max-w-[160px] truncate">
                          {appt.services.map((s) => s.name).join(", ")}
                        </td>
                        <td className="py-2.5 text-right">
                          LKR {appt.totalLkr.toLocaleString()}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inventory alerts — 1/3 */}
        <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
          <SectionHeader
            icon={<Package size={16} />}
            title="Inventory Alerts"
            href="/admin/inventory"
          />

          {criticalItems.length === 0 && lowItems.length === 0 ? (
            <div className="mt-3 flex flex-col items-center justify-center gap-2 py-8 text-center text-gray-500">
              <CheckCircle2 size={28} className="text-green-500/60" />
              <p className="text-sm">All stock levels are healthy</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {criticalItems.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-red-300">
                      {item.name}
                    </p>
                    <p className="text-xs text-red-400/70">
                      {item.currentStock} {item.unit} left
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                    Critical
                  </span>
                </div>
              ))}

              {lowItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-yellow-300">
                      {item.name}
                    </p>
                    <p className="text-xs text-yellow-400/70">
                      {item.currentStock} {item.unit} left
                    </p>
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-300">
                    Low
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loyalty snapshot */}
      <div className="rounded-xl border border-[#abd5ff]/20 bg-[#111827] p-5">
        <SectionHeader
          icon={<Star size={16} className="text-[#abd5ff]" />}
          title="Loyalty Program"
          href="/admin/loyalty"
          accent
        />
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <LoyaltyStat
            label="Total Members"
            value={loyaltyStats.totalMembers}
          />
          <LoyaltyStat
            label="Active Members"
            value={loyaltyStats.activeMembers}
          />
          <LoyaltyStat
            label="Points Issued"
            value={loyaltyStats.pointsIssued.toLocaleString()}
          />
          <LoyaltyStat
            label="Rewards Redeemed"
            value={loyaltyStats.rewardsRedeemed}
          />
        </div>
      </div>
    </div>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border bg-[#111827] p-5 ${
        accent ? "border-[#abd5ff]/25" : "border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-gray-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  count,
  href,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
  href: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div
        className={`flex items-center gap-2 text-sm font-semibold ${
          accent ? "text-[#abd5ff]" : ""
        }`}
      >
        <span className={accent ? "text-[#abd5ff]" : "text-gray-400"}>
          {icon}
        </span>
        {title}
        {count !== undefined && (
          <span className="rounded-full bg-gray-700 px-2 py-0.5 text-xs font-normal text-gray-300">
            {count}
          </span>
        )}
      </div>
      <Link
        href={href}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        View all <ChevronRight size={14} />
      </Link>
    </div>
  );
}

function EmptyState({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-gray-600">
      {icon}
      <p className="text-sm">{label}</p>
    </div>
  );
}

function LoyaltyStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-[#abd5ff]/10 bg-[#0f172a] p-4 text-center">
      <div className="text-xl font-semibold text-[#abd5ff]">{value}</div>
      <div className="mt-1 text-xs text-gray-400">{label}</div>
    </div>
  );
}