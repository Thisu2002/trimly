"use client";

import { useCallback, useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Pencil, Save, X, Scissors, MapPin, Phone, Mail } from "lucide-react";

type StylistProfile = {
  id: string;
  bio: string | null;
  yearsOfExperience: number | null;
  status: "on_duty" | "on_leave";
  salon: {
    id: string;
    name: string;
    phone: string | null;
    address: string | null;
  };
  user: {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  services: {
    id: string;
    name: string;
    durationMin: number;
    priceLkr: number;
  }[];
  weeklyShifts: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    isOff: boolean;
  }[];
};

export default function StylistProfilePage() {
  const [profile, setProfile] = useState<StylistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">(""); 

  function prefill(p: StylistProfile) {
    setName(p.user.name ?? "");
    setPhone(p.user.phone ?? "");
    setAddress(p.user.address ?? "");
    setBio(p.bio ?? "");
    setYearsOfExperience(p.yearsOfExperience ?? "");
  }

  const load = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${base}/api/stylist-dashboard/me?idToken=${token}`);
      const data = await res.json() as StylistProfile;
      if (!res.ok) throw new Error((data as unknown as { error: string }).error);
      setProfile(data);
      prefill(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      const token = await getAccessToken();
      const base = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${base}/api/stylist-dashboard/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          phone,
          address,
          bio,
          yearsOfExperience: yearsOfExperience === "" ? null : Number(yearsOfExperience),
        }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      await load();
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (profile) prefill(profile);
    setEditing(false);
    setError(null);
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading profile...</div>;
  if (!profile) return <div className="text-red-400 text-sm">Failed to load profile.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Profile</h1>
          <p className="text-sm text-gray-400">Manage your personal information</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-2 rounded-lg bg-gray-700 px-4 py-2 text-sm text-white transition hover:bg-gray-600"
          >
            <Pencil size={14} /> Edit
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition hover:bg-gray-700"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#1f4068] px-4 py-2 text-sm text-[#ABD5FF] transition hover:bg-[#274b72] disabled:opacity-50"
            >
              <Save size={14} /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Identity card */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#ABD5FF]/40 bg-gradient-to-br from-[#274b72] to-[#13213a] text-xl font-semibold text-[#ABD5FF] shadow-[0_0_20px_rgba(171,213,255,0.3)]">
            {(name || profile.user.name || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold">{name || profile.user.name}</div>
            <div className="text-sm text-gray-400">{profile.salon.name}</div>
            <StatusTag status={profile.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field
            label="Name"
            icon={<Scissors size={14} />}
            value={name}
            editing={editing}
            onChange={setName}
          />
          <Field
            label="Email"
            icon={<Mail size={14} />}
            value={profile.user.email ?? ""}
            editing={false} // email not editable
          />
          <Field
            label="Phone"
            icon={<Phone size={14} />}
            value={phone}
            editing={editing}
            onChange={setPhone}
          />
          <Field
            label="Address"
            icon={<MapPin size={14} />}
            value={address}
            editing={editing}
            onChange={setAddress}
          />
        </div>
      </div>

      {/* Professional info */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
        <h2 className="mb-4 text-base font-semibold">Professional Info</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs text-gray-400 uppercase tracking-wider">
              Bio
            </label>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-[#ABD5FF]/50 resize-none"
              />
            ) : (
              <p className="text-sm text-gray-300">
                {bio || <span className="text-gray-500 italic">No bio set</span>}
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-gray-400 uppercase tracking-wider">
              Years of Experience
            </label>
            {editing ? (
              <input
                type="number"
                min={0}
                value={yearsOfExperience}
                onChange={(e) =>
                  setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-28 rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-[#ABD5FF]/50"
              />
            ) : (
              <p className="text-sm text-gray-300">
                {yearsOfExperience !== "" && yearsOfExperience !== null
                  ? `${yearsOfExperience} year${Number(yearsOfExperience) !== 1 ? "s" : ""}`
                  : <span className="text-gray-500 italic">Not set</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
        <h2 className="mb-4 text-base font-semibold">Assigned Services</h2>
        {profile.services.length === 0 ? (
          <p className="text-sm text-gray-400">No services assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {profile.services.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-gray-800/50 px-4 py-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <Scissors size={14} className="text-gray-400" />
                  <span>{s.name}</span>
                  <span className="text-gray-500">{s.durationMin} min</span>
                </div>
                <span className="text-gray-300">LKR {s.priceLkr.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Salon info */}
      <div className="rounded-xl border border-white/10 bg-[#111827] p-6">
        <h2 className="mb-4 text-base font-semibold">Salon</h2>
        <div className="space-y-1.5 text-sm text-gray-300">
          <div className="font-medium text-white">{profile.salon.name}</div>
          {profile.salon.address && (
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={13} /> {profile.salon.address}
            </div>
          )}
          {profile.salon.phone && (
            <div className="flex items-center gap-2 text-gray-400">
              <Phone size={13} /> {profile.salon.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  value,
  editing,
  onChange,
}: {
  label: string;
  icon?: React.ReactNode;
  value: string;
  editing: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-wider text-gray-400">
        {label}
      </label>
      {editing && onChange ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-gray-800 px-3 py-2 text-sm text-white outline-none focus:border-[#ABD5FF]/50"
        />
      ) : (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          {icon && <span className="text-gray-500">{icon}</span>}
          {value || <span className="italic text-gray-500">Not set</span>}
        </div>
      )}
    </div>
  );
}

function StatusTag({ status }: { status: "on_duty" | "on_leave" }) {
  return (
    <span
      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        status === "on_duty"
          ? "bg-green-900/40 text-green-300"
          : "bg-yellow-900/40 text-yellow-300"
      }`}
    >
      {status === "on_duty" ? "On Duty" : "On Leave"}
    </span>
  );
}