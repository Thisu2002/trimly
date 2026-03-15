"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";

type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type BusinessHour = {
  dayOfWeek: DayOfWeek;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
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

const DEFAULT_HOURS: BusinessHour[] = [
  {
    dayOfWeek: "monday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "tuesday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "wednesday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "thursday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "friday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "saturday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
  {
    dayOfWeek: "sunday",
    openTime: "09:00",
    closeTime: "18:00",
    isClosed: false,
  },
];

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHour[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function fetchHours() {
    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${apiBase}/api/salon-hours/get`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken: token }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch business hours");
      }

      setHours(data.hours);
    } catch (err: any) {
      console.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHours();
  }, []);

  function updateDay<K extends keyof BusinessHour>(
    day: DayOfWeek,
    field: K,
    value: BusinessHour[K],
  ) {
    setHours((prev) =>
      prev.map((item) =>
        item.dayOfWeek === day ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSave() {
    setSaving(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${apiBase}/api/salon-hours`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken: token,
          hours,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save business hours");
      }

      setHours(data.hours);
      toast.success("Business hours updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update business hours");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading business hours...</div>;
  }

  return (
    <div className="p-6 space-y-6 text-white">
      <div>
        <h1 className="text-2xl font-semibold text-white">Business Hours</h1>
        <p className="text-sm text-white/60">
          Manage your salon’s weekly opening hours.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="grid grid-cols-4 gap-4 px-5 py-4 border-b border-white/10 text-sm font-medium text-white/70">
          <div>Day</div>
          <div>Open</div>
          <div>Close</div>
          <div>Closed</div>
        </div>

        <div className="divide-y divide-white/10">
          {hours.map((item) => (
            <div
              key={item.dayOfWeek}
              className="grid grid-cols-4 gap-4 px-5 py-4 items-center"
            >
              <div className="font-medium text-white">
                {DAY_LABELS[item.dayOfWeek]}
              </div>

              <div>
                <input
                  type="time"
                  value={item.openTime}
                  disabled={item.isClosed}
                  onChange={(e) =>
                    updateDay(item.dayOfWeek, "openTime", e.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none disabled:bg-white/5 disabled:text-white/40"
                />
              </div>

              <div>
                <input
                  type="time"
                  value={item.closeTime}
                  disabled={item.isClosed}
                  onChange={(e) =>
                    updateDay(item.dayOfWeek, "closeTime", e.target.value)
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white outline-none disabled:bg-white/5 disabled:text-white/40"
                />
              </div>

              <div>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.isClosed}
                    onChange={(e) =>
                      updateDay(item.dayOfWeek, "isClosed", e.target.checked)
                    }
                  />
                  <span className="text-sm text-white/80">Closed</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-[#2a4f7a] px-5 py-2.5 text-white disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Hours"}
        </button>
      </div>
    </div>
  );
}
