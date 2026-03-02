"use client";

import { useState } from "react";
import AddStylistModal from "@/components/admin/AddStylistModal";

export default function StylistsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">Service Management</h1>
          <p className="text-gray-400 text-sm">
            Manage categories, pricing and availability
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="border border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-800"
        >
          + Add Stylist
        </button>
      </div>
      <AddStylistModal
        open={open}
        onClose={() => {
          setOpen(false);
        }}
      />
    </div>
  );
}