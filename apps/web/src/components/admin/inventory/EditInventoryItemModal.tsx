// D:\trimly\apps\web\src\components\admin\inventory\EditInventoryItemModal.tsx
"use client";

import { useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";
import type { InventoryCategory, InventoryItem } from "@/app/(protected)/admin/(with-salon)/inventory/page";

interface Props {
  open: boolean;
  item: InventoryItem;
  categories: InventoryCategory[];
  onClose: () => void;
}

const UNIT_SUGGESTIONS = ["bottles", "tubes", "jars", "cans", "boxes", "packs", "pieces", "sets", "rolls", "pairs", "units"];

export default function EditInventoryItemModal({ open, item, categories, onClose }: Props) {
  const [name, setName] = useState(item.name);
  const [description, setDescription] = useState(item.description || "");
  const [categoryId, setCategoryId] = useState(item.categoryId || "");
  const [currentStock, setCurrentStock] = useState(item.currentStock);
  const [minStock, setMinStock] = useState(item.minStock);
  const [unit, setUnit] = useState(item.unit);
  const [notes, setNotes] = useState(item.notes || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/inventory/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          description,
          categoryId: categoryId || null,
          currentStock,
          minStock,
          unit,
          notes,
        }),
      });

      if (!res.ok) throw new Error("Failed");
      toast.success("Item updated!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Error updating item");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  const stockPct = minStock > 0 ? Math.min(100, Math.round((currentStock / minStock) * 100)) : 0;
  const stockStatus =
    currentStock < minStock * 0.5 ? "critical" : currentStock < minStock ? "low" : "good";

  const wasRestocked = currentStock > item.currentStock;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-1">Edit Item</h2>
        <p className="text-gray-400 text-xs mb-5">Update stock level or item details</p>

        <form
          onSubmit={handleSubmit}
          className={`space-y-4 transition ${loading ? "opacity-60 pointer-events-none" : ""}`}
        >
          {/* Name */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Item Name *</label>
            <input
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              rows={2}
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Unit</label>
            <input
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {UNIT_SUGGESTIONS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition ${
                    unit === u
                      ? "border-gray-400 bg-gray-700 text-white"
                      : "border-gray-700 text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* Stock numbers */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">
                Current Stock
                {wasRestocked && (
                  <span className="ml-1 text-green-400">(+{currentStock - item.currentStock} — restocked)</span>
                )}
              </label>
              <input
                type="number"
                min={0}
                className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1 block">Min Required</label>
              <input
                type="number"
                min={1}
                className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Stock bar */}
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Stock Level</span>
              <span>{stockPct}% of minimum</span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  stockStatus === "critical" ? "bg-red-500" : stockStatus === "low" ? "bg-yellow-400" : "bg-green-500"
                }`}
                style={{ width: `${stockPct}%` }}
              />
            </div>
            <div className={`text-xs mt-1 ${
              stockStatus === "critical" ? "text-red-400" : stockStatus === "low" ? "text-yellow-400" : "text-green-400"
            }`}>
              {stockStatus === "critical" ? "⚠ Critical — needs immediate restock" : stockStatus === "low" ? "↓ Running low" : "✓ Sufficient stock"}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Notes</label>
            <input
              placeholder="Any additional notes (optional)"
              className="w-full p-2 rounded bg-gray-800 outline-none text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-medium mt-2 transition"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}