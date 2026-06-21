//D:\trimly\apps\web\src\components\stylist\StylistMonthCalendar.tsx
"use client";

import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type CalendarSlot = {
  id: string;
  serviceName: string;
  startTime: string;
  endTime: string;
  customerName: string | null;
  customerPhone: string | null;
  appointmentStatus: string;
};

export type ShiftLite = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isOff: boolean;
};

const JS_DAY_TO_DOW: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Priority order used to pick the "dominant" status for a day's accent color.
// Pending needs attention, so it wins; cancelled is least visually important.
const STATUS_PRIORITY = ["pending", "confirmed", "completed", "cancelled"] as const;

const STATUS_DOT: Record<string, string> = {
  pending: "bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.7)]",
  confirmed: "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.7)]",
  completed: "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.7)]",
  cancelled: "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]",
};

const STATUS_CELL_ACCENT: Record<string, string> = {
  pending:
    "border-yellow-400/40 bg-gradient-to-b from-yellow-400/[0.10] to-yellow-400/[0.02] hover:from-yellow-400/[0.16]",
  confirmed:
    "border-blue-400/40 bg-gradient-to-b from-blue-400/[0.10] to-blue-400/[0.02] hover:from-blue-400/[0.16]",
  completed:
    "border-green-400/35 bg-gradient-to-b from-green-400/[0.09] to-green-400/[0.02] hover:from-green-400/[0.15]",
  cancelled:
    "border-red-400/30 bg-gradient-to-b from-red-400/[0.08] to-red-400/[0.02] hover:from-red-400/[0.13]",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-400 text-yellow-950",
  confirmed: "bg-blue-400 text-blue-950",
  completed: "bg-green-400 text-green-950",
  cancelled: "bg-red-400 text-red-950",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function getDow(year: number, month: number, day: number): DayOfWeek {
  return JS_DAY_TO_DOW[new Date(year, month, day).getDay()];
}

function getDominantStatus(slots: CalendarSlot[]): string | null {
  for (const status of STATUS_PRIORITY) {
    if (slots.some((s) => s.appointmentStatus === status)) return status;
  }
  return null;
}

function buildMonthGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month, 1);
  const totalDays = new Date(year, month + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0

  const cells: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export default function StylistMonthCalendar({
  year,
  month,
  appointmentsByDate,
  shiftMap,
  selectedDateKey,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: {
  year: number;
  month: number; // 0-indexed
  appointmentsByDate: Record<string, CalendarSlot[]>;
  shiftMap: Map<DayOfWeek, ShiftLite>;
  selectedDateKey: string;
  onSelectDate: (dateKey: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
}) {
  const weeks = buildMonthGrid(year, month);

  const todayKey = (() => {
    const t = new Date();
    return toDateKey(t.getFullYear(), t.getMonth(), t.getDate());
  })();

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-white/10 bg-[#111827] p-4">
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1d2a3a] text-[#ABD5FF]">
            <CalendarDays size={14} />
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-white">{monthLabel}</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToday}
            className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={onPrevMonth}
            aria-label="Previous month"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            onClick={onNextMonth}
            aria-label="Next month"
            className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-800 hover:text-white"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[9px] font-semibold uppercase tracking-widest text-gray-500"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Weeks */}
      <div className="space-y-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} className="h-12 sm:h-14" />;
              }

              const dateKey = toDateKey(year, month, day);
              const dow = getDow(year, month, day);
              const shift = shiftMap.get(dow);
              const isOff = !shift || shift.isOff;
              const slots = appointmentsByDate[dateKey] ?? [];
              const hasEvents = slots.length > 0;
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDateKey;

              const dominant = getDominantStatus(slots);
              const statuses = Array.from(
                new Set(slots.map((s) => s.appointmentStatus))
              ).slice(0, 4);

              const cellAccent =
                hasEvents && dominant ? STATUS_CELL_ACCENT[dominant] : "";

              return (
                <button
                  key={di}
                  onClick={() => onSelectDate(dateKey)}
                  className={`group relative flex h-12 flex-col justify-between rounded-lg border p-1 text-left transition-all duration-150 sm:h-14 sm:p-1.5 ${
                    isSelected
                      ? "border-[#ABD5FF] bg-gradient-to-b from-[#1d3a5f] to-[#16283f] shadow-[0_0_14px_rgba(171,213,255,0.3)]"
                      : hasEvents
                      ? `${cellAccent} hover:-translate-y-0.5 hover:shadow-md`
                      : isToday
                      ? "border-[#ABD5FF]/30 bg-[#13213a]/70"
                      : "border-white/5 bg-[#0f172a]/60 hover:border-white/15 hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold transition ${
                        isToday && !isSelected
                          ? "bg-[#ABD5FF] text-[#0b1220]"
                          : isSelected
                          ? "text-[#ABD5FF]"
                          : hasEvents
                          ? "text-white"
                          : isOff
                          ? "text-gray-600"
                          : "text-gray-300"
                      }`}
                    >
                      {day}
                    </span>

                    {hasEvents && (
                      <span
                        className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none ${
                          dominant ? STATUS_BADGE[dominant] : "bg-gray-400 text-gray-900"
                        }`}
                      >
                        {slots.length}
                      </span>
                    )}
                  </div>

                  {hasEvents ? (
                    <div className="flex items-center gap-1">
                      {statuses.map((s) => (
                        <span
                          key={s}
                          className={`h-2 w-2 rounded-full ${
                            STATUS_DOT[s] ?? "bg-gray-400"
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="h-2" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-white/10 pt-2.5 text-[10px] text-gray-500">
        <LegendDot color="bg-yellow-400" label="Pending" />
        <LegendDot color="bg-blue-400" label="Confirmed" />
        <LegendDot color="bg-green-400" label="Completed" />
        <LegendDot color="bg-red-400" label="Cancelled" />
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </div>
  );
}