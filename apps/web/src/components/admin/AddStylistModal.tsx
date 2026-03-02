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
};

export default function AddStylistModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bio, setBio] = useState("");
  const [yoe, setYoe] = useState(1);

  const [status, setStatus] = useState<"on_duty" | "on_leave">("on_duty");

  const [categories, setCategories] = useState<Category[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  async function fetchCategories() {
    const token = await getAccessToken();
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;
    const res = await fetch(`${apiBase}/api/service/categories?idToken=${token}`);
    setCategories(await res.json());
  }

  useEffect(() => {
    if (open) fetchCategories();
  }, [open]);

  function toggleCategory(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/stylist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken: token,
          name,
          email,
          phone,
          address,
          bio,
          yearsOfExperience: yoe,
          status,
          specialties: selected,
        }),
      });

      if (!res.ok) throw new Error();

      toast.success("Stylist added!");
      onClose();
    } catch (err) {
      toast.error("Failed to add stylist");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-[#111827] p-6 rounded-xl w-full max-w-md text-white space-y-3">
        <h2 className="text-lg font-semibold">Add Stylist</h2>

        <form onSubmit={handleSubmit} className="space-y-2">
          <input placeholder="Name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          <input placeholder="Email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input placeholder="Phone" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input placeholder="Address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} />

          <textarea placeholder="Bio" className="input" value={bio} onChange={(e) => setBio(e.target.value)} />

          <input
            type="number"
            placeholder="Years of Experience"
            className="input"
            value={yoe}
            onChange={(e) => setYoe(Number(e.target.value))}
          />

          <select value={status} onChange={(e) => setStatus(e.target.value as "on_duty" | "on_leave")} className="input">
            <option value="on_duty">On duty</option>
            <option value="on_leave">On leave</option>
          </select>

          <div>
            <p className="text-sm mb-1">Specialties</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCategory(c.id)}
                  className={`px-2 py-1 rounded text-sm ${
                    selected.includes(c.id) ? "bg-blue-600" : "bg-gray-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <button disabled={loading} className="w-full bg-blue-600 py-2 rounded">
            {loading ? "Saving..." : "Confirm"}
          </button>
        </form>
      </div>
    </div>
  );
}