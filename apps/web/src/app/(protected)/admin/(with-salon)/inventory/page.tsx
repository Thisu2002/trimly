// D:\trimly\apps\web\src\app\(protected)\admin\(with-salon)\inventory\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getAccessToken } from "@auth0/nextjs-auth0/client";
import { Edit, Package, Trash2 } from "lucide-react";
import { AnimatePresence } from "motion/react";
import AddInventoryItemModal from "@/components/admin/inventory/AddInventoryItemModal";
import EditInventoryItemModal from "@/components/admin/inventory/EditInventoryItemModal";
import AddInventoryCategoryModal from "@/components/admin/inventory/AddInventoryCategoryModal";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export type InventoryCategory = {
  id: string;
  name: string;
  description?: string | null;
  _count?: { items: number };
};

export type InventoryItem = {
  id: string;
  name: string;
  description?: string | null;
  categoryId?: string | null;
  category?: InventoryCategory | null;
  currentStock: number;
  minStock: number;
  unit: string;
  notes?: string | null;
  lastRestocked?: string | null;
};

type StockStatus = "critical" | "low" | "good";

function getStockStatus(item: InventoryItem): StockStatus {
  if (item.currentStock < item.minStock * 0.5) return "critical";
  if (item.currentStock < item.minStock) return "low";
  return "good";
}

const STATUS_STYLES: Record<
  StockStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  critical: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/30",
  },
  low: {
    label: "Low Stock",
    dot: "bg-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/30",
  },
  good: {
    label: "In Stock",
    dot: "bg-green-500",
    text: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [filterStatus, setFilterStatus] = useState<"all" | StockStatus>("all");

  const [addItemOpen, setAddItemOpen] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [addCategoryOpen, setAddCategoryOpen] = useState(false);

  // Delete dialog state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

  async function fetchAll() {
    try {
      setLoading(true);
      const token = await getAccessToken();
      const [itemsRes, catsRes] = await Promise.all([
        fetch(`${apiBase}/api/inventory/items?idToken=${token}`),
        fetch(`${apiBase}/api/inventory/categories?idToken=${token}`),
      ]);
      const [itemsData, catsData] = await Promise.all([
        itemsRes.json(),
        catsRes.json(),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setCategories(Array.isArray(catsData) ? catsData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleConfirmDelete() {
    if (!deletingId) return;
    setDeleteLoading(true);
    try {
      const token = await getAccessToken();
      await fetch(
        `${apiBase}/api/inventory/items/${deletingId}?idToken=${token}`,
        {
          method: "DELETE",
        },
      );
      setDeletingId(null);
      fetchAll();
    } finally {
      setDeleteLoading(false);
    }
  }

  // Stats
  const totalItems = items.length;
  const lowStockCount = items.filter((i) => {
    const s = getStockStatus(i);
    return s === "low" || s === "critical";
  }).length;
  const criticalCount = items.filter(
    (i) => getStockStatus(i) === "critical",
  ).length;
  const wellStockedCount = items.filter(
    (i) => getStockStatus(i) === "good",
  ).length;

  // Filter
  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        filterCategory === "All" || item.category?.name === filterCategory;
      const status = getStockStatus(item);
      const matchesStatus = filterStatus === "all" || status === filterStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [items, search, filterCategory, filterStatus]);

  const grouped = filtered.reduce<Record<string, InventoryItem[]>>(
    (acc, item) => {
      const key = item.category?.name || "Uncategorized";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    },
    {},
  );

  const categoryNames = useMemo(() => {
    const names = items
      .map((i) => i.category?.name)
      .filter((n): n is string => !!n);
    return ["All", ...Array.from(new Set(names))];
  }, [items]);

  const criticalItems = items.filter((i) => getStockStatus(i) === "critical");
  const deletingItem = items.find((i) => i.id === deletingId);

  const isAnyModalOpen = addItemOpen || !!editItem || addCategoryOpen;

  useEffect(() => {
    const content = document.getElementById("admin-content");
    if (!content) return;
    if (isAnyModalOpen) {
      content.scrollTo({ top: 0, behavior: "smooth" });
      content.style.overflow = "hidden";
    } else {
      content.style.overflow = "";
    }
    return () => {
      content.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  return (
    <>
      <div
        className={`relative space-y-6 transition duration-150 ${
          isAnyModalOpen ? "pointer-events-none blur-sm opacity-10" : ""
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold">Inventory Management</h1>
            <p className="text-gray-400 text-sm">
              Track and manage salon stock levels
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAddCategoryOpen(true)}
              className="border border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
            >
              + Category
            </button>
            <button
              onClick={() => setAddItemOpen(true)}
              className="border border-gray-600 px-4 py-2 rounded-lg hover:bg-gray-800 text-sm"
            >
              + Add Item
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Total Items" value={totalItems} />
          <StatCard title="Low Stock" value={lowStockCount} accent="yellow" />
          <StatCard title="Critical" value={criticalCount} accent="red" />
          <StatCard
            title="Well Stocked"
            value={wellStockedCount}
            accent="green"
          />
        </div>

        {/* Critical alert banner */}
        {criticalItems.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
            <span className="text-red-400 text-lg mt-0.5">⚠</span>
            <div>
              <p className="text-red-400 font-medium text-sm mb-1">
                {criticalItems.length} item
                {criticalItems.length > 1 ? "s are" : " is"} critically low
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalItems.map((item) => (
                  <span
                    key={item.id}
                    className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 rounded-full px-2 py-0.5"
                  >
                    {item.name}: {item.currentStock} {item.unit}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Search + Category Filter */}
        <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 flex flex-wrap gap-3 items-center">
          <input
            placeholder="Search items..."
            className="flex-1 min-w-[180px] bg-gray-800 rounded-lg px-3 py-2 outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {categoryNames.map((cat) => (
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

        {/* Stock Status Filter */}
        <div className="flex gap-2">
          {(["all", "good", "low", "critical"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterStatus === s
                  ? s === "all"
                    ? "bg-gray-600 text-white"
                    : s === "good"
                      ? "bg-green-500/30 text-green-300 border border-green-500/40"
                      : s === "low"
                        ? "bg-yellow-500/30 text-yellow-300 border border-yellow-500/40"
                        : "bg-red-500/30 text-red-300 border border-red-500/40"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {s === "all"
                ? "All"
                : s === "good"
                  ? "In Stock"
                  : s === "low"
                    ? "Low Stock"
                    : "Critical"}
            </button>
          ))}
        </div>

        {loading && (
          <div className="text-gray-400 text-sm">Loading inventory...</div>
        )}

        {/* Grouped Items */}
        <div className="space-y-8">
          {Object.entries(grouped).map(([categoryName, groupItems]) => (
            <div
              key={categoryName}
              className="border border-gray-700 rounded-xl p-5 bg-[#0f172a]"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{categoryName}</h2>
                <span className="text-xs text-gray-400">
                  {groupItems.length} item{groupItems.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {groupItems.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    onEdit={() => setEditItem(item)}
                    onDelete={() => setDeletingId(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 text-gray-500">
              <Package className="h-8 w-8 mb-2" />{" "}
              <p className="text-sm">No items found. Add an inventory item.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddInventoryItemModal
        open={addItemOpen}
        categories={categories}
        onClose={() => {
          setAddItemOpen(false);
          fetchAll();
        }}
      />

      {editItem && (
        <EditInventoryItemModal
          open={!!editItem}
          item={editItem}
          categories={categories}
          onClose={() => {
            setEditItem(null);
            fetchAll();
          }}
        />
      )}

      <AddInventoryCategoryModal
        open={addCategoryOpen}
        onClose={() => {
          setAddCategoryOpen(false);
          fetchAll();
        }}
      />

      <AnimatePresence>
        <ConfirmDeleteDialog
          open={!!deletingId}
          title="Delete this item?"
          message={
            deletingItem
              ? `"${deletingItem.name}" will be permanently removed from your inventory.`
              : "This item will be permanently removed from your inventory."
          }
          confirmLabel="Delete Item"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingId(null)}
          loading={deleteLoading}
        />
      </AnimatePresence>
    </>
  );
}

function StatCard({
  title,
  value,
  accent,
}: {
  title: string;
  value: string | number;
  accent?: "yellow" | "red" | "green";
}) {
  const color =
    accent === "yellow"
      ? "text-yellow-400"
      : accent === "red"
        ? "text-red-400"
        : accent === "green"
          ? "text-green-400"
          : "text-white";

  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 text-center">
      <div className="text-gray-400 text-sm">{title}</div>
      <div className={`text-xl font-semibold mt-1 ${color}`}>{value}</div>
    </div>
  );
}

function InventoryItemCard({
  item,
  onEdit,
  onDelete,
}: {
  item: InventoryItem;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const status = getStockStatus(item);
  const { label, dot, text, bg } = STATUS_STYLES[status];
  const pct = Math.min(
    100,
    Math.round((item.currentStock / item.minStock) * 100),
  );
  const barColor =
    status === "critical"
      ? "bg-red-500"
      : status === "low"
        ? "bg-yellow-400"
        : "bg-green-500";

  return (
    <div className="bg-[#111827] border border-gray-700 rounded-xl p-4 space-y-3">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="text-xs text-gray-400 mt-0.5 truncate">
            {item.description || "No description"}
          </div>
        </div>
        <div className="flex gap-1 ml-2 shrink-0">
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="h-7 w-7 rounded flex items-center justify-center text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stock numbers */}
      <div className="flex justify-between text-sm">
        <div>
          <span className="text-gray-400 text-xs">Current</span>
          <div className={`font-semibold ${text}`}>
            {item.currentStock}{" "}
            <span className="text-xs font-normal text-gray-400">
              {item.unit}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-gray-400 text-xs">Min required</span>
          <div className="font-semibold text-gray-300">
            {item.minStock}{" "}
            <span className="text-xs font-normal text-gray-400">
              {item.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`${barColor} h-full transition-all`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <div className="flex items-center gap-1">
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
            <span className={`text-xs ${text}`}>{label}</span>
          </div>
          <span className="text-xs text-gray-500">{pct}% of min</span>
        </div>
      </div>

      {/* Notes */}
      {item.notes && (
        <div className="text-xs text-gray-500 border-t border-gray-700 pt-2 truncate">
          📝 {item.notes}
        </div>
      )}

      {/* Warning row */}
      {status !== "good" && (
        <div className={`text-xs rounded-lg px-3 py-2 border ${bg} ${text}`}>
          {status === "critical"
            ? `Only ${item.currentStock} ${item.unit} left — restock immediately`
            : `Running low — consider restocking soon`}
        </div>
      )}
    </div>
  );
}
