"use client";

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type WeeklyShift = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  isOff: boolean;
};

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const DEFAULT_WEEKLY_SHIFTS: WeeklyShift[] = [
  { dayOfWeek: "monday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "tuesday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "wednesday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "thursday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "friday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "saturday", startTime: "09:00", endTime: "18:00", isOff: false },
  { dayOfWeek: "sunday", startTime: "09:00", endTime: "18:00", isOff: true },
];

export default function WeeklyShiftEditor({
  shifts,
  onChange,
}: {
  shifts: WeeklyShift[];
  onChange: (next: WeeklyShift[]) => void;
}) {
  function updateDay<K extends keyof WeeklyShift>(
    day: DayOfWeek,
    field: K,
    value: WeeklyShift[K]
  ) {
    onChange(
      shifts.map((item) =>
        item.dayOfWeek === day ? { ...item, [field]: value } : item
      )
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-[#0f172a]">
      <div className="grid grid-cols-4 gap-4 border-b border-gray-700 px-4 py-3 text-sm text-gray-400">
        <div>Day</div>
        <div>Start</div>
        <div>End</div>
        <div>Off</div>
      </div>

      <div className="divide-y divide-gray-700">
        {shifts.map((item) => (
          <div
            key={item.dayOfWeek}
            className="grid grid-cols-4 items-center gap-4 px-4 py-3"
          >
            <div className="font-medium text-white">
              {DAY_LABELS[item.dayOfWeek]}
            </div>

            <input
              type="time"
              value={item.startTime}
              disabled={item.isOff}
              onChange={(e) =>
                updateDay(item.dayOfWeek, "startTime", e.target.value)
              }
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 outline-none disabled:opacity-50"
            />

            <input
              type="time"
              value={item.endTime}
              disabled={item.isOff}
              onChange={(e) =>
                updateDay(item.dayOfWeek, "endTime", e.target.value)
              }
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 outline-none disabled:opacity-50"
            />

            <label className="inline-flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={item.isOff}
                onChange={(e) =>
                  updateDay(item.dayOfWeek, "isOff", e.target.checked)
                }
              />
              Off
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}