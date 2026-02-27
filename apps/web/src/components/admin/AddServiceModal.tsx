"use client";

import { useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddServiceModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(45);
  const [price, setPrice] = useState(1000);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/service`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          description,
          durationMin: duration,
          priceLkr: price,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      alert("Service added successfully!");
      onClose();
      location.reload();
    } catch {
      alert("Error adding service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      {/* Blur ONLY content */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#111827] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Add Service</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            placeholder="Service name"
            className="w-full p-2 rounded bg-gray-800 outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <textarea
            placeholder="Description"
            className="w-full p-2 rounded bg-gray-800 outline-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Duration (mins)"
              className="flex-1 p-2 rounded bg-gray-800 outline-none"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
            <input
              type="number"
              placeholder="Price (LKR)"
              className="flex-1 p-2 rounded bg-gray-800 outline-none"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 py-2 rounded mt-2"
          >
            {loading ? "Saving..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}