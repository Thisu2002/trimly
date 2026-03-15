"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Category = {
  id: string;
  name: string;
  description?: string | null;
};

export default function AddServiceModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(15);
  const [price, setPrice] = useState(500);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [addNewCategory, setAddNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");

  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(
        `${apiBase}/api/service/categories?idToken=${token}`,
      );
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories", err);
    }
  }

  useEffect(() => {
    if (!open) return;
    fetchCategories();
  }, [open]);

  function resetBasicInfo() {
    setName("");
    setDescription("");
    setDuration(15);
    setPrice(500);
    setNewCategoryName("");
    setNewCategoryDescription("");
  }

  function resetCategoryInfo() {
    setCategoryId("");
    setAddNewCategory(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!addNewCategory && !categoryId) {
      toast.error("Please select a category");
      return;
    }

    if (addNewCategory && !newCategoryName.trim()) {
      toast.error("New category name is required");
      return;
    }

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
          categoryId: addNewCategory ? null : categoryId,
          newCategoryName: addNewCategory ? newCategoryName : null,
          newCategoryDescription: addNewCategory
            ? newCategoryDescription
            : null,
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      toast.success("Service added successfully!");

      if (addNewCategory && data.createdCategoryId) {
        await fetchCategories();
        setCategoryId(data.createdCategoryId);
        setAddNewCategory(false);
      }

      resetBasicInfo();
    } catch (err) {
      console.error(err);
      toast.error("Error adding service");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          resetBasicInfo();
          resetCategoryInfo();
          onClose();
        }}
      />

      <div className="relative bg-gradient-to-b from-[#0b1220] via-[#0f1b33] to-[#08101f] text-white w-full max-w-md p-6 rounded-xl shadow-xl border border-gray-700">
        <h2 className="text-lg font-semibold mb-4">Add Service</h2>

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

          <div className="space-y-2">
            <select
              disabled={addNewCategory}
              className={`w-full p-2 rounded bg-gray-800 ${
                addNewCategory ? "opacity-50 cursor-not-allowed" : ""
              }`}
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={addNewCategory}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setAddNewCategory(checked);

                  if (checked) setCategoryId("");
                  if (!checked) {
                    setNewCategoryName("");
                    setNewCategoryDescription("");
                  }
                }}
              />
              Add new category
            </label>

            {addNewCategory && (
              <div className="space-y-2">
                <input
                  placeholder="Category name"
                  className="w-full p-2 rounded bg-gray-800"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <textarea
                  placeholder="Category description"
                  className="w-full p-2 rounded bg-gray-800"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <div>Duration (mins):
            <input
              type="number"
              placeholder="Duration (mins)"
              className="flex-1 p-2 rounded bg-gray-800 outline-none"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            /></div>
            <div>Price (LKR):
            <input
              type="number"
              placeholder="Price (LKR)"
              className="flex-1 p-2 rounded bg-gray-800 outline-none"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
            /></div>
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
