"use client";

import { useEffect, useMemo, useState } from "react";
import AddServiceModal from "@/components/admin/AddServiceModal";
import { getAccessToken } from "@auth0/nextjs-auth0/client";

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

  async function fetchServices() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(
        `${apiBase}/api/service/list?idToken=${token}`
      );
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
    const matchesSearch = s.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      filterCategory === "All" ||
      s.category?.name === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce<Record<string, Service[]>>(
    (acc, svc) => {
      const key = svc.category?.name || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(svc);
      return acc;
    },
    {}
  );

  const isModalOpen = open //|| !!editingServiceId;

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
            <h2 className="text-lg font-semibold mb-4">
              {categoryName}
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {items.map((svc) => (
                <ServiceCard key={svc.id} svc={svc} />
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>

      <AddServiceModal
        open={open}
        onClose={() => {
          setOpen(false);
          fetchServices();
        }}
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

function ServiceCard({ svc }: { svc: Service }) {
  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="font-medium">{svc.name}</div>
      <div className="text-sm text-gray-400">
        {svc.description || "No description"}
      </div>

      <div className="flex justify-between text-sm">
        <span>{svc.durationMin} min</span>
        <span className="font-semibold">
          LKR {svc.priceLkr.toLocaleString()}
        </span>
      </div>

      <div>
        <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
          <div className="bg-white h-full w-[70%]" />
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Popularity
        </div>
      </div>
    </div>
  );
}