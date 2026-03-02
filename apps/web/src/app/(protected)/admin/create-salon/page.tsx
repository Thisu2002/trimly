"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAccessToken } from "@auth0/nextjs-auth0";
import { toast } from "sonner";

export default function CreateSalonPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getAccessToken();
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL!;

      const res = await fetch(`${apiBase}/api/salon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token, name, phone, address }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create salon");
      } else {
        toast.success("Salon created successfully");
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch (err: Error | unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-[#111827] p-6 rounded-lg w-full max-w-md"
      >
        <h1 className="text-xl font-bold mb-4">Create Your Salon</h1>

        <input
          className="w-full mb-3 p-2 rounded bg-gray-800"
          placeholder="Salon Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          className="w-full mb-3 p-2 rounded bg-gray-800"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        <input
          className="w-full mb-4 p-2 rounded bg-gray-800"
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <button disabled={loading} className="w-full bg-blue-600 py-2 rounded">
          {loading ? "Creating..." : "Create Salon"}
        </button>
      </form>
    </div>
  );
}
