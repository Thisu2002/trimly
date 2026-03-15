"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";
import WeeklyShiftEditor, {
  DEFAULT_WEEKLY_SHIFTS,
  WeeklyShift,
} from "@/components/admin/WeeklyShiftEditor";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Service = {
  id: string;
  name: string;
};

type StylistStatus = "on_duty" | "on_leave";

export default function AddStylistModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [yoe, setYoe] = useState(1);
  const [status, setStatus] = useState<StylistStatus>("on_duty");
  const [weeklyShifts, setWeeklyShifts] =
    useState<WeeklyShift[]>(DEFAULT_WEEKLY_SHIFTS);

  const [services, setServices] = useState<Service[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchServices() {
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${apiBase}/api/service/list?idToken=${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch services");
      }

      setServices(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load services");
    }
  }

  useEffect(() => {
    if (open) {
      fetchServices();
    }
  }, [open]);

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setBio("");
    setYoe(1);
    setStatus("on_duty");
    setSelected([]);
    setWeeklyShifts(DEFAULT_WEEKLY_SHIFTS);
  }

  function handleClose() {
    if (loading) return;
    resetForm();
    onClose();
  }

  function toggleService(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function validateShifts(shifts: WeeklyShift[]) {
    for (const shift of shifts) {
      if (!shift.isOff && shift.startTime >= shift.endTime) {
        return `Invalid shift time for ${shift.dayOfWeek}`;
      }
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const shiftError = validateShifts(weeklyShifts);
    if (shiftError) {
      toast.error(shiftError);
      return;
    }

    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/stylist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          email,
          phone,
          address,
          bio,
          yearsOfExperience: yoe,
          status,
          services: selected,
          weeklyShifts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add stylist");
      }

      toast.success("Stylist added!");
      resetForm();
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to add stylist";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />

      <div className="relative max-h-[70vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-gray-700 bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add Stylist</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-gray-700 px-3 py-1 text-sm hover:bg-gray-800"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              placeholder="Name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              placeholder="Email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              placeholder="Phone"
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              placeholder="Address"
              className="input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <textarea
            placeholder="Bio"
            className="input min-h-[90px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="number"
              min={0}
              placeholder="Years of Experience"
              className="input"
              value={yoe}
              onChange={(e) => setYoe(Number(e.target.value))}
            />

            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "on_duty" | "on_leave")
              }
              className="input"
            >
              <option value="on_duty">On duty</option>
              <option value="on_leave">On leave</option>
            </select>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Services</p>
            <div className="flex flex-wrap gap-2">
              {services.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={`rounded-lg px-3 py-1.5 text-sm ${
                    selected.includes(service.id)
                      ? "bg-[#2a4f7a] text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Weekly Shifts</p>
            <WeeklyShiftEditor
              shifts={weeklyShifts}
              onChange={setWeeklyShifts}
            />
          </div>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-[#2a4f7a] py-2.5 text-white disabled:opacity-60"
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}