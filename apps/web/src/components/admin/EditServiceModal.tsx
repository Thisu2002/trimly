"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  serviceId: string | null;
  onClose: () => void;
}

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

type ServiceDetail = {
  id: string;
  name: string;
  description?: string | null;
  durationMin: number;
  priceLkr: number;
  categoryId: string;
  category?: { id: string; name: string } | null;
};

export default function EditServiceModal({ open, serviceId, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [price, setPrice] = useState(500);
  const [categoryId, setCategoryId] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  async function fetchCategories() {
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${apiBase}/api/service/categories?idToken=${token}`
      );
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }

  async function fetchService() {
    if (!serviceId) return;
    try {
      setFetching(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const res = await fetch(
        `${apiBase}/api/service/${serviceId}?idToken=${token}`
      );
      const data: ServiceDetail = await res.json();
      setName(data.name);
      setDescription(data.description ?? "");
      setDuration(data.durationMin);
      setPrice(data.priceLkr);
      setCategoryId(data.categoryId ?? "");
    } catch (err) {
      console.error("Failed to load service", err);
      toast.error("Failed to load service details");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    fetchCategories();
    fetchService();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, serviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId) return;

    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/service/${serviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          description,
          durationMin: duration,
          priceLkr: price,
          categoryId,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("Service updated successfully!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error updating service");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Edit Service</h2>

        {fetching ? (
          <div className="text-gray-400 py-8 text-center">Loading...</div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`space-y-3 transition ${
              loading ? "opacity-60 pointer-events-none" : ""
            }`}
          >
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

            <select
              className="w-full p-2 rounded bg-gray-800"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Duration (mins)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-800 outline-none"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1 block">Price (LKR)</label>
                <input
                  type="number"
                  className="w-full p-2 rounded bg-gray-800 outline-none"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-gray-600 py-2 rounded hover:bg-gray-800 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="flex-1 bg-blue-600 py-2 rounded text-sm hover:bg-blue-500"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}