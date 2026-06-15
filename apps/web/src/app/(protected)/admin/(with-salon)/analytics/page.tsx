"use client";

// D:\trimly\apps\web\src\app\(protected)\admin\(with-salon)\analytics\page.tsx

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CalendarDays,
  Banknote,
  Star,
  Users,
  Wrench,
  BarChart2,
} from "lucide-react";

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  date: string;          // ISO date string e.g. "2025-06-01"
  startTime: string;
  endTime: string;
  totalLkr: number;
  status: AppointmentStatus;
  services: {
    name: string;
    stylist: string;
    priceLkr: number;
  }[];
};

type SalonReview = {
  id: string;
  customerName: string;
  rating: number;
  comment: string | null;
  appointmentDate: string;
  createdAt: string;
};

type LoyaltyStats = {
  totalMembers: number;
  activeMembers: number;
  pointsIssued: number;
  rewardsRedeemed: number;
};

type Range = "7d" | "30d" | "90d" | "12m";

function getRangeStart(range: Range): Date {
  const now = new Date();
  if (range === "7d")  { now.setDate(now.getDate() - 7); return now; }
  if (range === "30d") { now.setDate(now.getDate() - 30); return now; }
  if (range === "90d") { now.setDate(now.getDate() - 90); return now; }
  // 12m
  now.setMonth(now.getMonth() - 12);
  return now;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatShortDate(dateStr: string, range: Range) {
  const d = new Date(dateStr + "T00:00:00");
  if (range === "12m") {
    return d.toLocaleDateString("en-US", { month: "short" });
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function AnalyticsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rawReviews, setRawReviews] = useState<SalonReview[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<Range>("30d");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const token = await getAccessToken();
        const api = process.env.NEXT_PUBLIC_API_BASE_URL!;

        const [apptRes, reviewRes, loyaltyRes] = await Promise.all([
          fetch(`${api}/api/appointment/salon?idToken=${token}`),
          fetch(`${api}/api/review/salon?idToken=${token}`),
          fetch(`${api}/api/loyalty/stats?idToken=${token}`),
        ]);

        const [apptData, reviewData, loyaltyData] = await Promise.all([
          apptRes.json(),
          reviewRes.ok ? reviewRes.json() : [],
          loyaltyRes.ok ? loyaltyRes.json() : null,
        ]);

        setAppointments(Array.isArray(apptData) ? apptData : []);
        setRawReviews(Array.isArray(reviewData) ? reviewData : []);
        setLoyalty(loyaltyData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rangeStart = useMemo(() => isoDate(getRangeStart(range)), [range]);
  const prevRangeStart = useMemo(() => {
    const d = getRangeStart(range);
    const diff = new Date().getTime() - d.getTime();
    return isoDate(new Date(d.getTime() - diff));
  }, [range]);

  const inRange = useMemo(
    () => appointments.filter((a) => a.date.slice(0, 10) >= rangeStart),
    [appointments, rangeStart],
  );
  const inPrevRange = useMemo(
    () => appointments.filter((a) => {
      const d = a.date.slice(0, 10);
      return d >= prevRangeStart && d < rangeStart;
    }),
    [appointments, prevRangeStart, rangeStart],
  );

  const reviews = useMemo(() => {
    if (rawReviews.length === 0) return null;
    const totalReviews = rawReviews.length;
    const avgRating = parseFloat(
      (rawReviews.reduce((s, r) => s + r.rating, 0) / totalReviews).toFixed(2),
    );
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1|2|3|4|5, number>;
    rawReviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1|2|3|4|5;
      distribution[star]++;
    });
    const recentReviews = rawReviews.slice(0, 5).map((r) => ({
      id: r.id,
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));
    return { avgRating, totalReviews, distribution, recentReviews };
  }, [rawReviews]);

  const revenue = inRange
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + a.totalLkr, 0);

  const prevRevenue = inPrevRange
    .filter((a) => a.status === "completed")
    .reduce((s, a) => s + a.totalLkr, 0);

  const totalBookings = inRange.length;
  const prevBookings = inPrevRange.length;

  const completedCount = inRange.filter((a) => a.status === "completed").length;
  const cancelledCount = inRange.filter((a) => a.status === "cancelled").length;
  const completionRate = totalBookings > 0 ? Math.round((completedCount / totalBookings) * 100) : 0;
  const prevCompleted = inPrevRange.filter((a) => a.status === "completed").length;
  const prevTotal = inPrevRange.length;
  const prevCompletionRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;

  const avgOrderValue = completedCount > 0 ? Math.round(revenue / completedCount) : 0;
  const prevAvg = prevCompleted > 0 ? Math.round(prevRevenue / prevCompleted) : 0;

  const revenueChart = useMemo(() => {
    const completed = inRange.filter((a) => a.status === "completed");

    if (range === "12m") {
      const map: Record<string, number> = {};
      completed.forEach((a) => {
        const key = a.date.slice(0, 7); // "2025-05"
        map[key] = (map[key] ?? 0) + a.totalLkr;
      });
      const start = getRangeStart("12m");
      const buckets: { label: string; value: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const key = isoDate(d).slice(0, 7);
        buckets.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          value: map[key] ?? 0,
        });
      }
      return buckets;
    }

    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const map: Record<string, number> = {};
    completed.forEach((a) => {
      const key = a.date.slice(0, 10); // normalize ISO timestamp → YYYY-MM-DD
      map[key] = (map[key] ?? 0) + a.totalLkr;
    });

    const buckets: { label: string; value: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = isoDate(d);
      buckets.push({ label: formatShortDate(key, range), value: map[key] ?? 0 });
    }
    return buckets;
  }, [inRange, range]);

  const bookingsChart = useMemo(() => {
    if (range === "12m") {
      const map: Record<string, number> = {};
      inRange.forEach((a) => {
        const key = a.date.slice(0, 7);
        map[key] = (map[key] ?? 0) + 1;
      });
      const start = getRangeStart("12m");
      return Array.from({ length: 12 }, (_, i) => {
        const d = new Date(start);
        d.setMonth(d.getMonth() + i);
        const key = isoDate(d).slice(0, 7);
        return { label: d.toLocaleDateString("en-US", { month: "short" }), value: map[key] ?? 0 };
      });
    }
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const map: Record<string, number> = {};
    inRange.forEach((a) => {
      const key = a.date.slice(0, 10); // normalize ISO timestamp → YYYY-MM-DD
      map[key] = (map[key] ?? 0) + 1;
    });
    return Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = isoDate(d);
      return { label: formatShortDate(key, range), value: map[key] ?? 0 };
    });
  }, [inRange, range]);

  // ── Top services ───────────────────────────────────────────────────────────

  const topServices = useMemo(() => {
    const map: Record<string, { bookings: number; revenue: number }> = {};
    inRange
      .filter((a) => a.status !== "cancelled")
      .forEach((a) =>
        a.services.forEach((s) => {
          if (!map[s.name]) map[s.name] = { bookings: 0, revenue: 0 };
          map[s.name].bookings += 1;
          map[s.name].revenue += s.priceLkr;
        }),
      );
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [inRange]);

  // ── Peak day of week ───────────────────────────────────────────────────────

  const dayOfWeekStats = useMemo(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const counts = Array(7).fill(0);
    inRange
      .filter((a) => a.status !== "cancelled")
      .forEach((a) => {
        const dow = new Date(a.date.slice(0, 10) + "T00:00:00").getDay();
        counts[dow]++;
      });
    return days.map((label, i) => ({ label, value: counts[i] }));
  }, [inRange]);

  // ── Status distribution ────────────────────────────────────────────────────

  const statusDist = useMemo(() => {
    const total = inRange.length || 1;
    const counts: Record<AppointmentStatus, number> = {
      pending: 0, confirmed: 0, completed: 0, cancelled: 0,
    };
    inRange.forEach((a) => counts[a.status]++);
    return (Object.entries(counts) as [AppointmentStatus, number][]).map(
      ([status, count]) => ({
        status,
        count,
        pct: Math.round((count / total) * 100),
      }),
    );
  }, [inRange]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-gray-400">
            Performance insights for your salon
          </p>
        </div>

        <RangeSelector value={range} onChange={setRange} />
      </div>

      {loading ? (
        <div className="flex h-60 items-center justify-center text-sm text-gray-400">
          Loading analytics...
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard
              label="Revenue"
              value={`LKR ${revenue.toLocaleString()}`}
              prev={prevRevenue}
              curr={revenue}
              icon={<Banknote size={16} />}
              accent
            />
            <KpiCard
              label="Total Bookings"
              value={totalBookings}
              prev={prevBookings}
              curr={totalBookings}
              icon={<CalendarDays size={16} />}
            />
            <KpiCard
              label="Completion Rate"
              value={`${completionRate}%`}
              prev={prevCompletionRate}
              curr={completionRate}
              icon={<BarChart2 size={16} />}
            />
            <KpiCard
              label="Avg Order Value"
              value={`LKR ${avgOrderValue.toLocaleString()}`}
              prev={prevAvg}
              curr={avgOrderValue}
              icon={<TrendingUp size={16} />}
            />
          </div>

          {/* Revenue chart + Status donut */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-gray-700 bg-[#111827] p-5">
              <ChartHeader title="Revenue Over Time" sub={`LKR ${revenue.toLocaleString()} total`} />
              <BarChart
                data={revenueChart}
                color="#abd5ff"
                formatValue={(v) => `LKR ${v.toLocaleString()}`}
              />
            </div>

            <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
              <ChartHeader title="Booking Status" sub={`${totalBookings} total`} />
              <div className="mt-4 space-y-3">
                {statusDist.map(({ status, count, pct }) => (
                  <StatusBar key={status} status={status} count={count} pct={pct} />
                ))}
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-gray-700 pt-4 text-center text-sm">
                <div>
                  <div className="text-lg font-semibold text-green-400">{completedCount}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-red-400">{cancelledCount}</div>
                  <div className="text-xs text-gray-500">Cancelled</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings chart + Peak day */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-xl border border-gray-700 bg-[#111827] p-5">
              <ChartHeader title="Bookings Over Time" sub={`${totalBookings} bookings`} />
              <BarChart
                data={bookingsChart}
                color="#6ee7b7"
                formatValue={(v) => `${v} booking${v !== 1 ? "s" : ""}`}
              />
            </div>

            <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
              <ChartHeader title="Peak Days" sub="bookings by weekday" />
              <div className="mt-4 space-y-2.5">
                {dayOfWeekStats.map(({ label, value }) => {
                  const max = Math.max(...dayOfWeekStats.map((d) => d.value), 1);
                  const pct = Math.round((value / max) * 100);
                  return (
                    <div key={label} className="flex items-center gap-3">
                      <span className="w-8 text-xs text-gray-400">{label}</span>
                      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#abd5ff]/70 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-gray-400">{value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top services */}
          <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
            <ChartHeader title="Top Services" sub="by revenue in selected period" />
            {topServices.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-600">
                <Wrench size={28} />
                <p className="text-sm">No service data for this period</p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {topServices.map((svc, i) => {
                  const maxRev = topServices[0].revenue || 1;
                  const pct = Math.round((svc.revenue / maxRev) * 100);
                  return (
                    <div
                      key={svc.name}
                      className="rounded-lg border border-gray-700/60 bg-[#0f172a] p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium leading-tight">{svc.name}</span>
                        <span className="shrink-0 rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">
                          #{i + 1}
                        </span>
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-400">
                        <span>{svc.bookings} booking{svc.bookings !== 1 ? "s" : ""}</span>
                        <span className="text-[#abd5ff]">LKR {svc.revenue.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#abd5ff]/60 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews + Loyalty side by side */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* Reviews */}
            <div className="rounded-xl border border-gray-700 bg-[#111827] p-5">
              <ChartHeader
                title="Customer Reviews"
                sub={reviews ? `${reviews.totalReviews} total reviews` : ""}
                icon={<Star size={15} className="text-yellow-400" />}
              />
              {!reviews ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-600">
                  <Star size={28} />
                  <p className="text-sm">No reviews data available</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-400">
                        {reviews.avgRating.toFixed(1)}
                      </div>
                      <StarRow rating={reviews.avgRating} />
                      <div className="mt-1 text-xs text-gray-500">
                        {reviews.totalReviews} review{reviews.totalReviews !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {([5, 4, 3, 2, 1] as const).map((star) => {
                        const count = reviews.distribution[star] ?? 0;
                        const pct = reviews.totalReviews > 0
                          ? Math.round((count / reviews.totalReviews) * 100)
                          : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-4 text-xs text-gray-400">{star}</span>
                            <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-yellow-400/70 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-6 text-right text-xs text-gray-500">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {reviews.recentReviews.length > 0 && (
                    <div className="mt-4 space-y-2 border-t border-gray-700 pt-4">
                      <p className="text-xs text-gray-500 mb-2">Recent</p>
                      {reviews.recentReviews.slice(0, 3).map((r) => (
                        <div
                          key={r.id}
                          className="rounded-lg border border-gray-700/60 bg-[#0f172a] p-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{r.customerName}</span>
                            <StarRow rating={r.rating} small />
                          </div>
                          {r.comment && (
                            <p className="mt-1 text-xs text-gray-400 line-clamp-2">{r.comment}</p>
                          )}
                          <p className="mt-1 text-xs text-gray-600">
                            {new Date(r.createdAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Loyalty */}
            <div className="rounded-xl border border-[#abd5ff]/20 bg-[#111827] p-5">
              <ChartHeader
                title="Loyalty Program"
                icon={<Users size={15} className="text-[#abd5ff]" />}
                accent
              />
              {!loyalty ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center text-gray-600">
                  <Users size={28} />
                  <p className="text-sm">No loyalty data available</p>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Members",    value: loyalty.totalMembers,   color: "text-white" },
                    { label: "Active Members",   value: loyalty.activeMembers,  color: "text-[#abd5ff]" },
                    { label: "Points Issued",    value: loyalty.pointsIssued.toLocaleString(), color: "text-green-400" },
                    { label: "Rewards Redeemed", value: loyalty.rewardsRedeemed, color: "text-yellow-400" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="rounded-lg border border-[#abd5ff]/10 bg-[#0f172a] p-4 text-center"
                    >
                      <div className={`text-2xl font-semibold ${color}`}>{value}</div>
                      <div className="mt-1 text-xs text-gray-400">{label}</div>
                    </div>
                  ))}
                </div>
              )}

              {loyalty && loyalty.totalMembers > 0 && (
                <div className="mt-4 rounded-lg border border-gray-700/60 bg-[#0f172a] p-4">
                  <p className="mb-2 text-xs text-gray-500">Member engagement</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Active</span>
                        <span>
                          {loyalty.totalMembers > 0
                            ? Math.round((loyalty.activeMembers / loyalty.totalMembers) * 100)
                            : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#abd5ff]/70 rounded-full transition-all duration-500"
                          style={{
                            width: `${loyalty.totalMembers > 0
                              ? Math.round((loyalty.activeMembers / loyalty.totalMembers) * 100)
                              : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Shared small components ───────────────────────────────────────────────────

function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  const options: { label: string; value: Range }[] = [
    { label: "7 days",   value: "7d"  },
    { label: "30 days",  value: "30d" },
    { label: "90 days",  value: "90d" },
    { label: "12 months", value: "12m" },
  ];
  return (
    <div className="relative flex items-center gap-1 rounded-lg border border-gray-700 bg-[#111827] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-gray-700 text-white"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  curr,
  prev,
  icon,
  accent,
}: {
  label: string;
  value: string | number;
  curr: number;
  prev: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  const delta = prev === 0 ? null : Math.round(((curr - prev) / prev) * 100);
  const up = delta !== null && delta > 0;
  const down = delta !== null && delta < 0;

  return (
    <div
      className={`rounded-xl border bg-[#111827] p-5 ${
        accent ? "border-[#abd5ff]/25" : "border-gray-700"
      }`}
    >
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className={accent ? "text-[#abd5ff]" : "text-gray-500"}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {delta !== null && (
        <div
          className={`mt-1 flex items-center gap-1 text-xs ${
            up ? "text-green-400" : down ? "text-red-400" : "text-gray-500"
          }`}
        >
          {up ? <TrendingUp size={12} /> : down ? <TrendingDown size={12} /> : <Minus size={12} />}
          {up ? "+" : ""}{delta}% vs prev period
        </div>
      )}
    </div>
  );
}

function ChartHeader({
  title,
  sub,
  icon,
  accent,
}: {
  title: string;
  sub?: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div
          className={`flex items-center gap-2 text-sm font-semibold ${
            accent ? "text-[#abd5ff]" : ""
          }`}
        >
          {icon && <span>{icon}</span>}
          {title}
        </div>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

function BarChart({
  data,
  color,
  formatValue,
}: {
  data: { label: string; value: number }[];
  color: string;
  formatValue: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  // For many buckets, only show every Nth label
  const step = data.length > 20 ? Math.ceil(data.length / 10) : data.length > 10 ? 3 : 1;

  return (
    <div className="mt-4">
      <div className="flex items-end gap-1 h-36">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end h-full">
              <div
                className="w-full rounded-t transition-all duration-500"
                style={{
                  height: `${Math.max(pct, d.value > 0 ? 2 : 0)}%`,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
              {/* Tooltip */}
              {d.value > 0 && (
                <div className="absolute bottom-full mb-1 hidden group-hover:flex whitespace-nowrap rounded bg-gray-900 border border-gray-700 px-2 py-1 text-xs text-gray-200 shadow-lg z-10 flex-col items-center gap-0.5 pointer-events-none">
                  <span>{d.label}</span>
                  <span className="font-semibold" style={{ color }}>{formatValue(d.value)}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* X-axis labels */}
      <div className="mt-1.5 flex gap-1">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            {i % step === 0 && (
              <span className="text-[10px] text-gray-600">{d.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_STYLES: Record<
  AppointmentStatus,
  { label: string; bar: string; text: string }
> = {
  completed: { label: "Completed", bar: "bg-green-500",  text: "text-green-400" },
  confirmed: { label: "Confirmed", bar: "bg-blue-500",   text: "text-blue-400"  },
  pending:   { label: "Pending",   bar: "bg-yellow-500", text: "text-yellow-400"},
  cancelled: { label: "Cancelled", bar: "bg-red-500",    text: "text-red-400"   },
};

function StatusBar({
  status,
  count,
  pct,
}: {
  status: AppointmentStatus;
  count: number;
  pct: number;
}) {
  const { label, bar, text } = STATUS_STYLES[status];
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={text}>{label}</span>
        <span className="text-gray-400">{count} ({pct}%)</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`${bar} h-full rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StarRow({ rating, small }: { rating: number; small?: boolean }) {
  const size = small ? 10 : 14;
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-700 fill-gray-700"
          }
        />
      ))}
    </div>
  );
}