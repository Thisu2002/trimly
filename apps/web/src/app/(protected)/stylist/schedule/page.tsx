"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Clock3, Scissors, User } from "lucide-react";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type Shift = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isOff: boolean;
};

type TodaySlot = {
  serviceName: string;
  startTime: string;
  endTime: string;
  customerName: string | null;
  customerPhone: string | null;
  appointmentStatus: string;
};

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

export default function StylistSchedulePage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = await getAccessToken();
        const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
        const res = await fetch(`${base}/api/stylist-dashboard/schedule?idToken=${token}`);
        const data = await res.json();
        setShifts(data.weeklyShifts ?? []);
        setTodaySchedule(data.todaySchedule ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const todayDow = new Date()
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as DayOfWeek;

  // Build a lookup map for easy access
  const shiftMap = new Map<DayOfWeek, Shift>();
  for (const s of shifts) shiftMap.set(s.dayOfWeek, s);

  if (loading) return <div className="text-gray-400 text-sm">Loading schedule...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">My Schedule</h1>
        <p className="text-sm text-gray-400">Weekly shifts and today&apos;s bookings</p>
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

      {/* Today's bookings */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Today&apos;s Bookings
          <span className="ml-2 text-sm font-normal text-gray-400">
            ({todaySchedule.length} appointment{todaySchedule.length !== 1 ? "s" : ""})
          </span>
        </h2>

        {todaySchedule.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#111827] p-6 text-sm text-gray-400">
            No bookings for today.
          </div>
        ) : (
          <div className="space-y-3">
            {todaySchedule.map((slot, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#111827] p-4"
              >
                {/* Timeline dot */}
                <div className="flex flex-col items-center self-stretch">
                  <div className="mt-1 h-3 w-3 rounded-full border-2 border-[#ABD5FF] bg-[#0b1220]" />
                  {i < todaySchedule.length - 1 && (
                    <div className="mt-1 flex-1 w-px bg-white/10" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Scissors size={14} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-sm">{slot.serviceName}</span>
                    <StatusPill status={slot.appointmentStatus} />
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                    <User size={13} />
                    {slot.customerName ?? "Unknown"}
                    {slot.customerPhone && (
                      <span className="text-gray-500">· {slot.customerPhone}</span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-medium text-white">
                    {slot.startTime}
                  </div>
                  <div className="text-xs text-gray-500">– {slot.endTime}</div>
                </div>
              </div>
            ))}
          </div>
        )}
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