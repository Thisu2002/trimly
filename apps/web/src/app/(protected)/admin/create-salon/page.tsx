// D:\trimly\apps\web\src\app\(protected)\admin\create-salon\page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@auth0/nextjs-auth0";
import { toast } from "sonner";
import Image from "next/image";

export default function CreateSalonPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length + photos.length > 5) {
      toast.error("You can upload a maximum of 5 photos");
      return;
    }
    setPhotos((prev) => [...prev, ...files]);
    setPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removePhoto(index: number) {
    URL.revokeObjectURL(previews[index]);
    setPhotos((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      // Use FormData — not JSON — so files can be sent
      const formData = new FormData();
      formData.append("idToken", token);
      formData.append("name", name);
      formData.append("phone", phone);
      formData.append("address", address);
      photos.forEach((file) => formData.append("photos", file));

      const res = await fetch(`${apiBase}/api/salon`, {
        method: "POST",
        // Do NOT set Content-Type manually; the browser sets it with the boundary
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create salon");

      toast.success("Salon created successfully");
      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err: Error | unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111827] p-6 rounded-lg w-full max-w-md"
      >
        <h1 className="text-xl font-bold mb-4">Create Your Salon</h1>

        <input
          className="w-full mb-3 p-2 rounded bg-gray-800"
          placeholder="Salon Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="w-full mb-3 p-2 rounded bg-gray-800"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="w-full mb-4 p-2 rounded bg-gray-800"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        {/* Photo upload */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">
            Salon Photos (up to 5)
          </label>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-3">
              {previews.map((src, i) => (
                <div key={i} className="relative group">
                  <Image
                    src={src}
                    alt={`Preview ${i + 1}`}
                    width={100}
                    height={80}
                    className="w-full h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length < 5 && (
            <label className="flex items-center justify-center w-full h-10 border border-dashed border-gray-600 rounded cursor-pointer hover:border-gray-400 transition">
              <span className="text-sm text-gray-400">+ Add photos</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        <button disabled={loading} className="w-full bg-blue-600 py-2 rounded">
          {loading ? "Creating..." : "Create Salon"}
        </button>
      </form>
    </div>
  );
}