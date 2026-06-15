// D:\trimly\apps\web\src\app\(protected)\admin\(with-salon)\services\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import AddServiceModal from "@/components/admin/AddServiceModal";
import EditServiceModal from "@/components/admin/EditServiceModal";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Pencil, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

type Service = {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  priceLkr: number;
  category?: {
    id: string;
    name: string;
    description?: string;
  } | null;
};

export default function ServicesPage() {
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchServices() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/service/list?idToken=${token}`);
      const data = await res.json();
      setServices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  async function handleDelete() {
    if (!deletingServiceId) return;
    setDeleteLoading(true);
    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(
        `${apiBase}/api/service/${deletingServiceId}?idToken=${token}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      toast.success("Service deleted");
      setDeletingServiceId(null);
      fetchServices();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error deleting service"
      );
    } finally {
      setDeleteLoading(false);
    }
  }

  const totalServices = services.length;
  const totalCategories = new Set(
    services.map((s) => s.category?.name).filter(Boolean)
  ).size;
  const avgPrice =
    services.length === 0
      ? 0
      : Math.round(
          services.reduce((sum, s) => sum + s.priceLkr, 0) / services.length
        );

  const categories = useMemo(() => {
    const names = services
      .map((s) => s.category?.name)
      .filter((name): name is string => !!name);
    const unique = Array.from(new Set(names));
    return ["All", ...unique];
  }, [services]);

  const filtered = services.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      filterCategory === "All" || s.category?.name === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce<Record<string, Service[]>>((acc, svc) => {
    const key = svc.category?.name || "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(svc);
    return acc;
  }, {});

  const isModalOpen = open || !!editingServiceId || !!deletingServiceId;

  useEffect(() => {
    const content = document.getElementById("admin-content");
    if (!content) return;

    if (isModalOpen) {
      content.scrollTo({ top: 0, behavior: "smooth" });
      content.style.overflow = "hidden";
    } else {
      content.style.overflow = "";
    }

    return () => {
      content.style.overflow = "";
    };
  }, [isModalOpen]);

  const deletingService = services.find((s) => s.id === deletingServiceId);

  return (
    <>
      <div
        className={`relative space-y-6 transition duration-150 ${
          isModalOpen ? "pointer-events-none blur-sm opacity-10" : ""
        }`}
      >
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
            + Add Service
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Total Services" value={totalServices} />
          <StatCard title="Categories" value={totalCategories} />
          <StatCard
            title="Avg Price"
            value={`LKR ${avgPrice.toLocaleString()}`}
          />
          <StatCard title="Active" value={totalServices} />
        </div>

        <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 flex gap-3">
          <input
            placeholder="Search services..."
            className="flex-1 bg-gray-800 rounded-lg px-3 py-2 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filterCategory === cat
                  ? "bg-gray-600"
                  : "bg-gray-800 hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-gray-400">Loading services...</div>
        )}

        <div className="space-y-8">
          {Object.entries(grouped).map(([categoryName, items]) => (
            <div
              key={categoryName}
              className="border border-gray-700 rounded-xl p-5 bg-[#0f172a]"
            >
              <h2 className="text-lg font-semibold mb-4">{categoryName}</h2>

              <div className="grid grid-cols-2 gap-4">
                {items.map((svc) => (
                  <ServiceCard
                    key={svc.id}
                    svc={svc}
                    onEdit={() => setEditingServiceId(svc.id)}
                    onDelete={() => setDeletingServiceId(svc.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 text-gray-500">
            <Wrench className="h-8 w-8 mb-2" />
            <p className="text-sm">No services found. Add a service.</p>
          </div>
        )}
      </div>

      <AddServiceModal
        open={open}
        onClose={() => {
          setOpen(false);
          fetchServices();
        }}
      />

      <EditServiceModal
        open={!!editingServiceId}
        serviceId={editingServiceId}
        onClose={() => {
          setEditingServiceId(null);
          fetchServices();
        }}
      />

      <ConfirmDeleteDialog
        open={!!deletingServiceId}
        title="Delete Service"
        message={`Are you sure you want to delete "${deletingService?.name}"? This action cannot be undone.`}
        confirmLabel="Delete Service"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeletingServiceId(null)}
      />
    </>
  );
}

function StatCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 text-center">
      <div className="text-gray-400 text-sm">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}

function ServiceCard({
  svc,
  onEdit,
  onDelete,
}: {
  svc: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="font-medium">{svc.name}</div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-gray-600 hover:bg-gray-800 text-gray-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg border border-gray-600 hover:bg-red-900/40 text-gray-300 hover:text-red-400 hover:border-red-800"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="text-sm text-gray-400">
        {svc.description || "No description"}
      </div>

      <div className="flex justify-between text-sm">
        <span>{svc.durationMin} min</span>
        <span className="font-semibold">
          LKR {svc.priceLkr.toLocaleString()}
        </span>
      </div>
    </div>
  );
}