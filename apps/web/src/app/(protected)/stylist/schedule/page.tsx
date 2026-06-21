//D:\trimly\apps\web\src\app\(protected)\stylist\schedule\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Clock3, Scissors, User } from "lucide-react";
import StylistMonthCalendar, {
  CalendarSlot,
  ShiftLite,
  DayOfWeek,
  toDateKey,
} from "@/components/stylist/StylistMonthCalendar";

const DAY_ORDER: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function StylistSchedulePage() {
  const [shifts, setShifts] = useState<ShiftLite[]>([]);
  const [shiftsLoading, setShiftsLoading] = useState(true);

  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const [appointmentsByDate, setAppointmentsByDate] = useState<
    Record<string, CalendarSlot[]>
  >({});
  const [calendarLoading, setCalendarLoading] = useState(true);

  const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const [selectedDateKey, setSelectedDateKey] = useState(todayKey);

  // Load weekly recurring shifts once
  useEffect(() => {
    async function loadShifts() {
      try {
        const token = await getAccessToken();
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const res = await fetch(`${base}/api/stylist-dashboard/schedule?idToken=${token}`);
        const data = await res.json();
        setShifts(data.weeklyShifts ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setShiftsLoading(false);
      }
    }
    loadShifts();
  }, []);

  // Load the month's appointments whenever the viewed month changes
  useEffect(() => {
    async function loadCalendar() {
      try {
        setCalendarLoading(true);
        const token = await getAccessToken();
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const monthStr = `${viewYear}-${pad(viewMonth + 1)}`;
        const res = await fetch(
          `${base}/api/stylist-dashboard/calendar?month=${monthStr}&idToken=${token}`
        );
        const data = await res.json();
        setAppointmentsByDate(data.appointmentsByDate ?? {});
      } catch (err) {
        console.error(err);
      } finally {
        setCalendarLoading(false);
      }
    }
    loadCalendar();
  }, [viewYear, viewMonth]);

  const shiftMap = useMemo(() => {
    const map = new Map<DayOfWeek, ShiftLite>();
    for (const s of shifts) map.set(s.dayOfWeek, s);
    return map;
  }, [shifts]);

  const todayDow = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as DayOfWeek;

  function goPrevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDateKey(todayKey);
  }

  const selectedSlots = appointmentsByDate[selectedDateKey] ?? [];
  const selectedDateLabel = parseDateKey(selectedDateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const isSelectedToday = selectedDateKey === todayKey;

  if (shiftsLoading) return <div className="text-gray-400 text-sm">Loading schedule...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Schedule</h1>
        <p className="text-sm text-gray-400">Weekly shifts and your monthly bookings</p>
      </div>

      {/* Weekly shift grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Weekly Shifts</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
          {DAY_ORDER.map((day) => {
            const shift = shiftMap.get(day);
            const isToday = day === todayDow;
            const isOff = !shift || shift.isOff;

            return (
              <div
                key={day}
                className={`rounded-xl border p-4 text-center transition ${
                  isToday
                    ? "border-[#ABD5FF]/50 bg-gradient-to-b from-[#1a2f4a] to-[#111827] shadow-[0_0_20px_rgba(171,213,255,0.08)]"
                    : "border-white/10 bg-[#111827]"
                }`}
              >
                <div
                  className={`text-xs font-semibold uppercase tracking-widest ${
                    isToday ? "text-[#ABD5FF]" : "text-gray-400"
                  }`}
                >
                  {DAY_LABELS[day]}
                </div>
                {isToday && (
                  <div className="mt-1 text-[10px] text-[#ABD5FF]/70">Today</div>
                )}
                <div className="mt-3">
                  {isOff ? (
                    <span className="inline-block rounded-full bg-red-900/30 px-2.5 py-1 text-xs text-red-400">
                      Off
                    </span>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-300">
                        <Clock3 size={11} />
                        {shift!.startTime}
                      </div>
                      <div className="text-xs text-gray-500">to</div>
                      <div className="flex items-center justify-center gap-1 text-xs text-gray-300">
                        <Clock3 size={11} />
                        {shift!.endTime}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly calendar */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Monthly Bookings</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <StylistMonthCalendar
            year={viewYear}
            month={viewMonth}
            appointmentsByDate={appointmentsByDate}
            shiftMap={shiftMap}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onToday={goToday}
          />

          {/* Selected day's bookings */}
          <div className="rounded-xl border border-white/10 bg-[#111827] p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold">
                {isSelectedToday ? "Today" : selectedDateLabel}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedSlots.length} appointment{selectedSlots.length !== 1 ? "s" : ""}
              </p>
            </div>

            {calendarLoading ? (
              <div className="text-sm text-gray-400">Loading...</div>
            ) : selectedSlots.length === 0 ? (
              <div className="text-sm text-gray-400">No bookings for this day.</div>
            ) : (
              <div className="space-y-3">
                {selectedSlots.map((slot, i) => (
                  <div
                    key={slot.id ?? i}
                    className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#0f172a] p-3"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ABD5FF]/30 bg-gradient-to-br from-[#274b72] to-[#13213a] text-[#ABD5FF]">
                      <Scissors size={12} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-medium">{slot.serviceName}</span>
                        <StatusPill status={slot.appointmentStatus} />
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                        <User size={12} />
                        {slot.customerName ?? "Unknown"}
                        {slot.customerPhone && (
                          <span className="text-gray-500">· {slot.customerPhone}</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {slot.startTime} – {slot.endTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
      className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${
        map[status] ?? "bg-gray-700 text-gray-300"
      }`}
    >
      {status}
    </span>
  );
}