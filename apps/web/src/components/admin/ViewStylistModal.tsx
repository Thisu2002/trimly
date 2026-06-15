"use client";

import { Clock3, Mail, Phone, MapPin, Briefcase, X } from "lucide-react";
import type { WeeklyShift } from "@/components/admin/WeeklyShiftEditor";

type StylistStatus = "on_duty" | "on_leave";

export type StylistForView = {
  id: string;
  bio?: string | null;
  yearsOfExperience?: number | null;
  status: StylistStatus;
  createdAt?: string;
  appointmentCount: number;
  totalSalonAppointmentServices: number;
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

interface Props {
  stylist: StylistForView | null;
  open: boolean;
  onClose: () => void;
}

const DAY_LABELS: Record<string, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const DAY_ORDER = [
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday",
];

export default function ViewStylistModal({ stylist, open, onClose }: Props) {
  if (!open || !stylist) return null;

  const initials = stylist.user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  const sortedShifts = stylist.weeklyShifts
    ? [...stylist.weeklyShifts].sort(
        (a, b) => DAY_ORDER.indexOf(a.dayOfWeek) - DAY_ORDER.indexOf(b.dayOfWeek)
      )
    : [];

  const workingDays = sortedShifts.filter((s) => !s.isOff);

  const joinedDate = stylist.createdAt
    ? new Date(stylist.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative max-h-[75vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-gray-700 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Stylist Profile</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-700 p-1.5 hover:bg-gray-800"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Identity */}
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-gray-500 text-xl font-semibold">
              {initials}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{stylist.user.name}</h3>
              {joinedDate && (
                <p className="text-xs text-gray-500 mt-0.5">Joined {joinedDate}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    stylist.status === "on_duty"
                      ? "bg-green-900/40 text-green-300"
                      : "bg-yellow-900/40 text-yellow-300"
                  }`}
                >
                  {stylist.status === "on_duty" ? "On Duty" : "On Leave"}
                </span>
                <span className="flex items-center gap-1 text-sm text-gray-300">
                  <Briefcase size={13} className="text-gray-400" />
                  {stylist.yearsOfExperience != null
                    ? `${stylist.yearsOfExperience} yr${stylist.yearsOfExperience === 1 ? '' : 's'} exp`
                    : "Stylist"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4 space-y-2.5">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
              Contact
            </p>
            <InfoRow icon={<Mail size={14} />} value={stylist.user.email} />
            <InfoRow icon={<Phone size={14} />} value={stylist.user.phone || "—"} />
            <InfoRow icon={<MapPin size={14} />} value={stylist.user.address || "—"} />
          </div>

          {/* Bio */}
          {stylist.bio && (
            <div className="rounded-xl border border-gray-700 bg-[#111827] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-2">
                Bio
              </p>
              <p className="text-sm text-gray-300 leading-relaxed">{stylist.bio}</p>
            </div>
          )}

          {/* Services */}
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
              Services ({stylist.services.length})
            </p>
            {stylist.services.length === 0 ? (
              <p className="text-sm text-gray-500">No services assigned</p>
            ) : (
              <div className="space-y-2">
                {stylist.services.map((svc) => (
                  <div
                    key={svc.id}
                    className="flex items-center justify-between rounded-lg bg-[#0f172a] px-3 py-2 text-sm"
                  >
                    <span>{svc.name}</span>
                    <div className="flex items-center gap-3 text-gray-400 text-xs">
                      <span>{svc.durationMin} min</span>
                      <span className="font-medium text-gray-200">
                        LKR {svc.priceLkr.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Weekly schedule */}
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-3">
              Weekly Schedule
            </p>
            {sortedShifts.length === 0 ? (
              <p className="text-sm text-gray-500">No shifts set</p>
            ) : (
              <div className="space-y-1.5">
                {sortedShifts.map((shift) => (
                  <div
                    key={shift.dayOfWeek}
                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Clock3 size={13} className="text-gray-500" />
                      <span className="w-8 text-gray-300">
                        {DAY_LABELS[shift.dayOfWeek]}
                      </span>
                    </div>
                    {shift.isOff ? (
                      <span className="text-xs text-gray-500">Off</span>
                    ) : (
                      <span className="text-gray-300">
                        {shift.startTime} – {shift.endTime}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-gray-500">
              {workingDays.length} working day{workingDays.length !== 1 ? "s" : ""} per week
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span className="text-gray-500">{icon}</span>
      <span>{value}</span>
    </div>
  );
}