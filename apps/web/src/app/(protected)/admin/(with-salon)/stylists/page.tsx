"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import AddStylistModal from "@/components/admin/AddStylistModal";
import EditStylistModal from "@/components/admin/EditStylistModal";
import ViewStylistModal from "@/components/admin/ViewStylistModal";
import type { StylistForView } from "@/components/admin/ViewStylistModal";
import { Search, Pencil, Clock3, User, Briefcase, Trash2 } from "lucide-react";
import type { WeeklyShift } from "@/components/admin/WeeklyShiftEditor";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

type StylistStatus = "on_duty" | "on_leave";

type Stylist = StylistForView;

export default function StylistsPage() {
  const [open, setOpen] = useState(false);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [viewingStylist, setViewingStylist] = useState<Stylist | null>(null);
  const [deletingStylist, setDeletingStylist] = useState<Stylist | null>(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"All" | StylistStatus>("All");

  async function fetchStylists() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/stylist/list?idToken=${token}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch stylists");

      setStylists(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

    async function handleDelete() {
    if (!deletingStylist) return;
    setDeleteLoading(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(
        `${apiBase}/api/stylist/${deletingStylist.id}?idToken=${token}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("Stylist deleted");
      setDeletingStylist(null);
      fetchStylists();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error deleting stylist"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  useEffect(() => {
    fetchStylists();
  }, []);

  const totalStaff = stylists.length;
  const onDutyCount = stylists.filter((s) => s.status === "on_duty").length;
  const totalAppointments = stylists.reduce((sum, s) => sum + s.appointmentCount, 0);

  const filteredStylists = useMemo(() => {
    return stylists.filter((stylist) => {
      const query = search.toLowerCase();

      const matchesSearch =
        stylist.user.name.toLowerCase().includes(query) ||
        stylist.user.email.toLowerCase().includes(query) ||
        stylist.bio?.toLowerCase().includes(query) ||
        stylist.services.some((s) => s.name.toLowerCase().includes(query));

      const matchesStatus =
        filterStatus === "All" || stylist.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [stylists, search, filterStatus]);

  const isModalOpen = open || !!editingStylist || !!viewingStylist || !!deletingStylist;

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Total Staff" value={totalStaff} />
          <StatCard title="On Duty" value={onDutyCount} />
          <StatCard title="Total Bookings" value={totalAppointments} />
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
              <FilterButton active={filterStatus === "All"} onClick={() => setFilterStatus("All")} label="All" />
              <FilterButton active={filterStatus === "on_duty"} onClick={() => setFilterStatus("on_duty")} label="On Duty" />
              <FilterButton active={filterStatus === "on_leave"} onClick={() => setFilterStatus("on_leave")} label="On Leave" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading stylists...</div>
        ) : filteredStylists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <User className="mb-2 h-8 w-8" />
            <p className="text-sm">No stylists found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredStylists.map((stylist) => (
              <StylistCard
                key={stylist.id}
                stylist={stylist}
                totalAppointments={totalAppointments}
                onEdit={() => setEditingStylist(stylist)}
                onView={() => setViewingStylist(stylist)}
                onDelete={() => setDeletingStylist(stylist)}
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
        open={!!editingStylist}
        stylistId={editingStylist?.id ?? null}
        initialData={editingStylist}
        onClose={() => {
          setEditingStylist(null);
          fetchStylists();
        }}
      />

      <ViewStylistModal
        open={!!viewingStylist}
        stylist={viewingStylist}
        onClose={() => setViewingStylist(null)}
      />

      <ConfirmDeleteDialog
              open={!!deletingStylist}
              title="Delete Stylist"
              message={`Are you sure you want to delete "${deletingStylist?.user.name}"? This action cannot be undone.`}
              confirmLabel="Delete Stylist"
              loading={deleteLoading}
              onConfirm={handleDelete}
              onCancel={() => setDeletingStylist(null)}
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

function FilterButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm ${active ? "bg-gray-600" : "bg-gray-800 hover:bg-gray-700"}`}
    >
      {label}
    </button>
  );
}

function StylistCard({
  stylist,
  totalAppointments,
  onEdit,
  onView,
  onDelete
}: {
  stylist: Stylist;
  totalAppointments: number;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  const initials = stylist.user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const shiftSummary = getShiftSummary(stylist.weeklyShifts);
  const popularityPct = totalAppointments > 0
    ? Math.round((stylist.appointmentCount / totalAppointments) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gray-500 text-lg font-medium">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold">{stylist.user.name}</h3>
          <span className="flex items-center gap-1 text-sm text-gray-300">
                  <Briefcase size={13} className="text-gray-400" />
                  {stylist.yearsOfExperience != null
                    ? `${stylist.yearsOfExperience} yr${stylist.yearsOfExperience === 1 ? '' : 's'} exp`
                    : "Stylist"}
                </span>
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

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-gray-400">
          <span>Booking popularity</span>
          <span className="font-medium text-gray-300">
            {popularityPct}%
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-700">
          <div
            className="h-full rounded-full bg-[#abd5ff]/70 transition-all duration-500"
            style={{ width: `${popularityPct}%` }}
          />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onView}
          className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
        >
          View Profile
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-gray-600 p-2 hover:bg-gray-800"
        >
          <Pencil size={16} />
        </button>
        <button
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-gray-600 hover:bg-red-900/40 text-gray-300 hover:text-red-400 hover:border-red-800"
          >
            <Trash2 size={14} />
          </button>
      </div>
    </div>
  );
}

const JS_DAY_TO_SHIFT_DAY = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
] as const;

function getShiftSummary(shifts?: WeeklyShift[]) {
  if (!shifts || shifts.length === 0) return "No shifts set";

  const workingDays = shifts.filter((s) => !s.isOff);
  if (workingDays.length === 0) return "Off all week";

  const today = JS_DAY_TO_SHIFT_DAY[new Date().getDay()];
  const todayShift = shifts.find((s) => s.dayOfWeek === today);

  if (!todayShift) return `${workingDays.length} working days • No shift today`;
  if (todayShift.isOff) return `${workingDays.length} working days • Off today`;

  return `${workingDays.length} working days • Today (${todayShift.startTime} - ${todayShift.endTime})`;
}