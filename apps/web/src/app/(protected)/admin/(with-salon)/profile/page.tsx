// D:\trimly\apps\web\src\app\(protected)\admin\(with-salon)\profile\page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";
import { Pencil, X, Plus, Building2, Phone, MapPin, ImageIcon } from "lucide-react";
import Image from "next/image";

type Salon = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  photos: string[];
};

export default function SalonProfilePage() {
  const [salon, setSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // edit state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  // existing photo URLs to keep
  const [keepPhotos, setKeepPhotos] = useState<string[]>([]);
  // newly picked files
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchSalon() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(`${apiBase}/api/salon/me?idToken=${token}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSalon(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load salon");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSalon();
  }, []);

  function openEdit() {
    if (!salon) return;
    setName(salon.name);
    setPhone(salon.phone ?? "");
    setAddress(salon.address ?? "");
    setKeepPhotos([...salon.photos]);
    setNewFiles([]);
    setNewPreviews([]);
    setEditing(true);
  }

  function cancelEdit() {
    newPreviews.forEach((url) => URL.revokeObjectURL(url));
    setEditing(false);
  }

  function removeExistingPhoto(url: string) {
    setKeepPhotos((prev) => prev.filter((u) => u !== url));
  }

  function removeNewPhoto(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalAfter = keepPhotos.length + newFiles.length + files.length;
    if (totalAfter > 5) {
      toast.error("Maximum 5 photos allowed");
      return;
    }
    setNewFiles((prev) => [...prev, ...files]);
    setNewPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
    // reset so same file can be picked again if removed
    e.target.value = "";
  }

  async function handleSave() {
    if (!salon) return;
    setSaving(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const formData = new FormData();
      formData.append("idToken", token);
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("address", address);
      formData.append("keepPhotos", JSON.stringify(keepPhotos));
      newFiles.forEach((f) => formData.append("newPhotos", f));

      const res = await fetch(`${apiBase}/api/salon/me`, {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSalon(data);
      toast.success("Salon updated");
      setEditing(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  const totalPhotos = keepPhotos.length + newFiles.length;

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400">
        Loading salon...
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="flex h-40 items-center justify-center text-gray-400">
        Salon not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Salon Profile</h1>
          <p className="text-sm text-gray-400">
            View and manage your salon details
          </p>
        </div>

        {!editing ? (
          <button
            onClick={openEdit}
            className="flex items-center gap-2 rounded-xl border border-gray-700 bg-[#111827] px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            <Pencil size={15} />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="rounded-xl border border-gray-700 bg-[#111827] px-4 py-2 text-sm hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-gray-700 bg-[#111827] p-6">
        {/* Salon avatar + name */}
        <div className="flex items-center gap-5 border-b border-gray-700 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#ABD5FF]/50 bg-gradient-to-br from-[#274b72] to-[#13213a] text-2xl font-bold text-[#ABD5FF] shadow-[0_0_20px_rgba(171,213,255,0.5)]">
            {salon.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xl font-semibold">{salon.name}</p>
            <p className="text-sm text-gray-400">Salon ID: {salon.id.slice(0, 8)}…</p>
          </div>
        </div>

        {/* Details grid */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <DetailField
            icon={<Building2 size={16} className="text-gray-400" />}
            label="Salon Name"
            value={salon.name}
            editing={editing}
            input={
              <input
                className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            }
          />

          <DetailField
            icon={<Phone size={16} className="text-gray-400" />}
            label="Phone"
            value={salon.phone || "—"}
            editing={editing}
            input={
              <input
                className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            }
          />

          <div className="sm:col-span-2">
            <DetailField
              icon={<MapPin size={16} className="text-gray-400" />}
              label="Address"
              value={salon.address || "—"}
              editing={editing}
              input={
                <textarea
                  rows={2}
                  className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm outline-none resize-none"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full address"
                />
              }
            />
          </div>
        </div>
      </div>

      {/* Photos card */}
      <div className="rounded-xl border border-gray-700 bg-[#111827] p-6">
        <div className="mb-4 flex items-center gap-2">
          <ImageIcon size={16} className="text-gray-400" />
          <h2 className="font-semibold">Salon Photos</h2>
          <span className="ml-auto text-xs text-gray-500">
            {(editing ? totalPhotos : salon.photos.length)} / 5
          </span>
        </div>

        {/* View mode */}
        {!editing && (
          <>
            {salon.photos.length === 0 ? (
              <p className="text-sm text-gray-500">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {salon.photos.map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-gray-700">
                    <Image
                      src={url}
                      alt={`Salon photo ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit mode */}
        {editing && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {/* Existing photos */}
            {keepPhotos.map((url, i) => (
              <div key={`keep-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-700">
                <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingPhoto(url)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* New file previews */}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="group relative aspect-square overflow-hidden rounded-lg border border-blue-700/50">
                <Image src={src} alt={`New photo ${i + 1}`} fill className="object-cover" />
                <div className="absolute left-1 top-1 rounded bg-blue-600/80 px-1 text-[10px] text-white">
                  New
                </div>
                <button
                  type="button"
                  onClick={() => removeNewPhoto(i)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <X size={12} />
                </button>
              </div>
            ))}

            {/* Add button */}
            {totalPhotos < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-600 text-gray-500 transition hover:border-gray-400 hover:text-gray-300"
              >
                <Plus size={24} />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>

      {/* Stats row — same style as staff page */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Services" value="—" />
        <StatCard title="Total Staff" value="—" />
        <StatCard title="Appointments" value="—" />
        <StatCard title="Avg Rating" value="—" />
      </div>
    </div>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function DetailField({
  icon,
  label,
  value,
  editing,
  input,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  editing: boolean;
  input: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-gray-400">
        {icon}
        {label}
      </div>
      {editing ? input : <p className="text-sm">{value}</p>}
    </div>
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