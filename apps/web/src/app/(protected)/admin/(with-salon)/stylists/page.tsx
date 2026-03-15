"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import AddStylistModal from "@/components/admin/AddStylistModal";
import EditStylistModal from "@/components/admin/EditStylistModal";
import { Search, Star, CalendarDays, Pencil, Clock3 } from "lucide-react";
import type { WeeklyShift } from "@/components/admin/WeeklyShiftEditor";

type StylistStatus = "on_duty" | "on_leave";

type Stylist = {
  id: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  status: StylistStatus;
  createdAt?: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
  };
  services: {
    id: string;
    name: string;
    durationMin: number;
    priceLkr: number;
  }[];
  weeklyShifts?: WeeklyShift[];
};

export default function StylistsPage() {
  const [open, setOpen] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStylistId, setEditingStylistId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | StylistStatus>(
    "All",
  );

  async function fetchStylists() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/stylist/list?idToken=${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch stylists");
      }

      setStylists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStylists();
  }, []);

  const totalStaff = stylists.length;
  const onDutyCount = stylists.filter((s) => s.status === "on_duty").length;

  const totalRevenue = stylists.reduce((sum, stylist) => {
    return (
      sum +
      stylist.services.reduce((svcSum, svc) => {
        return svcSum + svc.priceLkr;
      }, 0)
    );
  }, 0);

  const avgRating = 4.8;

  const filteredStylists = useMemo(() => {
    return stylists.filter((stylist) => {
      const query = search.toLowerCase();

      const matchesSearch =
        stylist.user.name.toLowerCase().includes(query) ||
        stylist.user.email.toLowerCase().includes(query) ||
        stylist.bio?.toLowerCase().includes(query) ||
        stylist.services.some((service) =>
          service.name.toLowerCase().includes(query),
        );

      const matchesStatus =
        filterStatus === "All" || stylist.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [stylists, search, filterStatus]);

  const isModalOpen = open || !!editingStylistId;

  useEffect(() => {
  const content = document.getElementById("admin-content");
  if (!content) return;

  if (isModalOpen) {
    content.scrollTo({ top: 0, behavior: "smooth" });
    content.style.overflow = "hidden";
  } else {
    content.style.overflow = "";
  }

  return () => {
    content.style.overflow = "";
  };
}, [isModalOpen]);

  return (
    <>
      <div
        className={`relative space-y-6 transition duration-150 ${
          isModalOpen ? "pointer-events-none blur-sm opacity-10" : ""
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Staff Management</h1>
            <p className="text-sm text-gray-400">
              Manage your team members and their profiles
            </p>
          </div>

          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-gray-700 bg-[#111827] px-4 py-2 font-medium hover:bg-gray-800"
          >
            + Add Staff Member
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Staff" value={totalStaff} />
          <StatCard title="On Duty" value={onDutyCount} />
          <StatCard
            title="Monthly Revenue"
            value={`LKR ${totalRevenue.toLocaleString()}`}
          />
          <StatCard title="Avg Rating" value={avgRating} />
        </div>

        <div className="rounded-xl border border-gray-700 bg-[#111827] p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search by name, email, service..."
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
              <FilterButton
                active={filterStatus === "All"}
                onClick={() => setFilterStatus("All")}
                label="All"
              />
              <FilterButton
                active={filterStatus === "on_duty"}
                onClick={() => setFilterStatus("on_duty")}
                label="On Duty"
              />
              <FilterButton
                active={filterStatus === "on_leave"}
                onClick={() => setFilterStatus("on_leave")}
                label="On Leave"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading stylists...</div>
        ) : filteredStylists.length === 0 ? (
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-6 text-gray-400">
            No stylists found.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStylists.map((stylist) => (
              <StylistCard
                key={stylist.id}
                stylist={stylist}
                onEdit={() => setEditingStylistId(stylist.id)}
              />
            ))}
          </div>
        )}
      </div>

      <AddStylistModal
        open={open}
        onClose={() => {
          setOpen(false);
          fetchStylists();
        }}
      />

      <EditStylistModal
        open={!!editingStylistId}
        stylistId={editingStylistId}
        onClose={() => {
          setEditingStylistId(null);
          fetchStylists();
        }}
      />
    </>
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

function StylistCard({
  stylist,
  onEdit,
}: {
  stylist: Stylist;
  onEdit: () => void;
}) {
  const initials = getInitials(stylist.user.name);
  const shiftSummary = getShiftSummary(stylist.weeklyShifts);

  return (
    <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gray-500 text-lg font-medium">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">
            {stylist.user.name}
          </h3>
          <p className="text-sm text-gray-400">
            {stylist.yearsOfExperience
              ? `${stylist.yearsOfExperience} years experience`
              : "Stylist"}
          </p>
          <div className="mt-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                stylist.status === "on_duty"
                  ? "bg-green-900/40 text-green-300"
                  : "bg-yellow-900/40 text-yellow-300"
              }`}
            >
              {stylist.status === "on_duty" ? "On Duty" : "On Leave"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {stylist.services.length > 0 ? (
          stylist.services.slice(0, 4).map((service) => (
            <span
              key={service.id}
              className="rounded-full border border-gray-600 px-2.5 py-1 text-xs text-gray-300"
            >
              {service.name}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-400">No services assigned</span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-lg border border-gray-700 bg-[#0f172a] px-3 py-2 text-sm text-gray-300">
        <Clock3 size={16} className="text-gray-400" />
        <span className="truncate">{shiftSummary}</span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MiniStat
          icon={<Star size={16} className="text-yellow-400" />}
          value={4.8}
          label="Rating"
        />
        <MiniStat
          icon={<CalendarDays size={16} className="text-gray-300" />}
          value={stylist.status === "on_duty" ? "Active" : "Away"}
          label="Status"
        />
        <MiniStat
          value={`LKR ${stylist.services
            .reduce((sum, service) => sum + service.priceLkr, 0)
            .toLocaleString()}`}
          label="Value"
        />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600">
          View Profile
        </button>

        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-600 p-2 hover:bg-gray-800"
        >
          <Pencil size={16} />
        </button>
      </div>
    </div>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon?: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-base font-semibold">{value}</div>
      <div className="text-xs text-gray-400">{label}</div>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

const JS_DAY_TO_SHIFT_DAY = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function getShiftSummary(shifts?: WeeklyShift[]) {
  if (!shifts || shifts.length === 0) {
    return "No shifts set";
  }

  const workingDays = shifts.filter((shift) => !shift.isOff);
  if (workingDays.length === 0) {
    return "Off all week";
  }

  const today = JS_DAY_TO_SHIFT_DAY[new Date().getDay()];
  const todayShift = shifts.find((shift) => shift.dayOfWeek === today);

  if (!todayShift) {
    return `${workingDays.length} working days • No shift today`;
  }

  if (todayShift.isOff) {
    return `${workingDays.length} working days • Off today`;
  }

  return `${workingDays.length} working days • Today (${todayShift.startTime} - ${todayShift.endTime})`;
}
