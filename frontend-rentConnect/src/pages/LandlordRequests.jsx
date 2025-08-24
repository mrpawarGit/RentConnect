import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const STATUS_OPTIONS = ["pending", "in_progress", "completed"];
const URGENCY = ["low", "medium", "high"];
const CATEGORIES = ["plumbing", "electrical", "hvac", "appliances", "general"];

const chip = (s) =>
  s === "completed"
    ? "bg-green-100 text-green-700"
    : s === "in_progress"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

export default function LandlordRequests() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState({
    status: "",
    urgency: "",
    category: "",
    text: "",
  });
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    try {
      const { data } = await api.get("/maintenance/landlord");
      setItems(data);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load requests");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (q.status && r.status !== q.status) return false;
      if (q.urgency && r.urgency !== q.urgency) return false;
      if (q.category && r.category !== q.category) return false;
      if (q.text) {
        const t = q.text.toLowerCase();
        const hay =
          `${r.description} ${r.property?.title} ${r.tenant?.name}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [items, q]);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/maintenance/${id}/status`, { status });
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <section className="max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-4">Maintenance Requests</h2>

      {/* Filters */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <select
          className="border rounded p-2"
          value={q.status}
          onChange={(e) => setQ({ ...q, status: e.target.value })}
        >
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={q.urgency}
          onChange={(e) => setQ({ ...q, urgency: e.target.value })}
        >
          <option value="">All Urgencies</option>
          {URGENCY.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={q.category}
          onChange={(e) => setQ({ ...q, category: e.target.value })}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          className="border rounded p-2 col-span-2"
          placeholder="Search…"
          value={q.text}
          onChange={(e) => setQ({ ...q, text: e.target.value })}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-primary)] text-[var(--color-bg)]">
            <tr>
              <th className="text-left p-3">Property</th>
              <th className="text-left p-3">Tenant</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Urgency</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Description</th>
              <th className="text-left p-3">Attachments</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id} className="border-t">
                <td className="p-3">{r.property?.title}</td>
                <td className="p-3">{r.tenant?.name}</td>
                <td className="p-3">{r.category}</td>
                <td className="p-3 capitalize">{r.urgency}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded ${chip(r.status)}`}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td
                  className="p-3 max-w-[280px] truncate"
                  title={r.description}
                >
                  {r.description}
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    {(r.attachments || []).map((a, i) => (
                      <a
                        key={i}
                        href={a}
                        target="_blank"
                        rel="noreferrer"
                        // className="underline"
                      >
                        <div className="border border-solid border-primary px-2 py-1 rounded text-sm">
                          File-{i + 1}
                        </div>
                      </a>
                    ))}
                  </div>
                </td>
                <td className="p-3 space-x-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      disabled={updatingId === r._id || r.status === s}
                      onClick={() => updateStatus(r._id, s)}
                      className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan="8">
                  No requests match filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
