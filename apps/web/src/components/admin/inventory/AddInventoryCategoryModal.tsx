// D:\trimly\apps\web\src\components\admin\inventory\AddInventoryCategoryModal.tsx
"use client";

import { useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddInventoryCategoryModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  function reset() {
    setName("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Category name is required");
      return;
    }
    setLoading(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/inventory/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, name, description }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success("Category added!");
      reset();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error adding category");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => { reset(); onClose(); }}
      />

      <div className="relative bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] text-white w-full max-w-sm p-6 rounded-xl shadow-xl border border-gray-700">
        <h2 className="text-lg font-semibold mb-1">Add Category</h2>
        <p className="text-gray-400 text-xs mb-5">Group inventory items by category</p>

        <form
          onSubmit={handleSubmit}
          className={`space-y-4 transition ${loading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category Name *</label>
            <input
              placeholder="e.g. Hair Colour Products"
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              placeholder="What kind of items go here? (optional)"
              rows={2}
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Preview */}
          {name && (
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Preview</div>
              <div className="font-medium text-sm">{name}</div>
              {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium mt-2 transition"
          >
            {loading ? "Saving..." : "Add Category"}
          </button>
        </form>
      </div>
    </div>
  );
}