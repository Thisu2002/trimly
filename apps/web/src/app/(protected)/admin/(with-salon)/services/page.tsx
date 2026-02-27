"use client";

import { useState } from "react";
import AddServiceModal from "@/components/admin/AddServiceModal";

export default function ServicesPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Services</h1>

        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-4 py-2 rounded-lg"
        >
          + Add Service
        </button>
      </div>

      <AddServiceModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}