// RentConnect/frontend-rentConnect/src/pages/LandlordPayments.jsx

import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

function monthStartEnd(yyyyMm) {
  // yyyyMm like "2025-08"
  if (!yyyyMm) return { start: "", end: "" };
  const [y, m] = yyyyMm.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0); // last day of month
  const fmt = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
}

const badge = (s) =>
  s === "paid"
    ? "bg-green-100 text-green-700"
    : s === "overdue"
    ? "bg-red-100 text-red-700"
    : s === "delayed"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

// Helpers for month/year selects
const MONTHS = [
  { label: "January", value: 1 },
  { label: "February", value: 2 },
  { label: "March", value: 3 },
  { label: "April", value: 4 },
  { label: "May", value: 5 },
  { label: "June", value: 6 },
  { label: "July", value: 7 },
  { label: "August", value: 8 },
  { label: "September", value: 9 },
  { label: "October", value: 10 },
  { label: "November", value: 11 },
  { label: "December", value: 12 },
];

export default function LandlordPayments() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ status: "", q: "" });
  const [showForm, setShowForm] = useState(false);

  const now = new Date();
  const [form, setForm] = useState({
    tenantId: "",
    propertyId: "",
    amount: "",
    currency: "INR", // ← default INR
    periodMonth: "", // derived from selected year + month
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
    dueDate: "",
    notes: "",
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      setLoading(true);
      const [inv, props] = await Promise.all([
        api.get("/payments/landlord"),
        api.get("/properties"),
      ]);
      setItems(Array.isArray(inv.data) ? inv.data : []);
      setProperties(Array.isArray(props.data) ? props.data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Keep periodMonth in sync with month + year
  useEffect(() => {
    if (!form.year || !form.month) return;
    const yyyyMm = `${form.year}-${String(form.month).padStart(2, "0")}`;
    setForm((f) => ({ ...f, periodMonth: yyyyMm }));
  }, [form.year, form.month]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter.status && i.status !== filter.status) return false;
      if (filter.q) {
        const t = filter.q.toLowerCase();
        const hay = `${i.tenant?.name ?? ""} ${i.property?.title ?? ""} ${
          i.amount ?? ""
        } ${i.currency ?? ""}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [items, filter]);

  async function createInvoice(e) {
    e.preventDefault();

    if (!form.periodMonth) {
      alert("Please select a Month.");
      return;
    }
    const { start, end } = monthStartEnd(form.periodMonth);

    const payload = {
      tenantId: form.tenantId,
      propertyId: form.propertyId,
      amount: Number(form.amount || 0),
      currency: "INR", // enforce INR
      periodStart: start,
      periodEnd: end,
      dueDate: form.dueDate,
      notes: form.notes,
    };

    try {
      await api.post("/payments/invoice", payload);
      setShowForm(false);
      setForm({
        tenantId: "",
        propertyId: "",
        amount: "",
        currency: "INR",
        periodMonth: "",
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        dueDate: "",
        notes: "",
      });
      await load();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to create invoice.");
    }
  }

  async function approveDelay(id, approve) {
    let newDueDate = undefined;
    if (approve) {
      const input = prompt("New due date (YYYY-MM-DD) or leave blank:");
      if (input) newDueDate = input;
    }
    try {
      await api.post(`/payments/invoice/${id}/approve-delay`, {
        approve,
        newDueDate,
      });
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to update delay request.");
    }
  }

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Rent Invoices</h2>
        <button
          className="border rounded px-3 py-1"
          onClick={() => setShowForm(true)}
        >
          Create Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          className="border rounded p-2"
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="">All statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="delayed">Delayed</option>
        </select>
        <input
          className="border rounded p-2 flex-1"
          placeholder="Search…"
          value={filter.q}
          onChange={(e) => setFilter((f) => ({ ...f, q: e.target.value }))}
        />
        <button className="border rounded px-3 py-1" onClick={load}>
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left">Tenant</th>
              <th className="p-3 text-left">Property</th>
              <th className="p-3 text-left">Period</th>
              <th className="p-3 text-left">Due</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i._id} className="border-t">
                <td className="p-3">{i.tenant?.name || "—"}</td>
                <td className="p-3">{i.property?.title || "—"}</td>
                <td className="p-3">
                  {i.periodStart
                    ? new Date(i.periodStart).toLocaleDateString()
                    : "—"}{" "}
                  –{" "}
                  {i.periodEnd
                    ? new Date(i.periodEnd).toLocaleDateString()
                    : "—"}
                </td>
                <td className="p-3">
                  {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : "—"}
                </td>
                <td className="p-3">
                  {i.amount} {i.currency}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded ${badge(i.status)}`}>
                    {i.status}
                  </span>
                </td>
                <td className="p-3 space-x-2">
                  {i.delayRequested && (
                    <>
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-50"
                        onClick={() => approveDelay(i._id, true)}
                      >
                        Approve Delay
                      </button>
                      <button
                        className="px-2 py-1 border rounded hover:bg-gray-50"
                        onClick={() => approveDelay(i._id, false)}
                      >
                        Reject Delay
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan={7}>
                  {loading ? "Loading…" : "No invoices."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create invoice modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          {/* Explicit light mode background + text, dark mode only via dark: */}
          <div className="bg-white text-gray-900 dark:bg-neutral-900 dark:text-neutral-100 border rounded p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form onSubmit={createInvoice} className="space-y-3">
              <label className="block">
                <div className="mb-1">Property (auto sets tenant)</div>
                <select
                  className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                  required
                  value={form.propertyId}
                  onChange={(e) => {
                    const propertyId = e.target.value;
                    const prop = properties.find((p) => p._id === propertyId);
                    const tenantId = prop?.tenants?.[0]?._id || "";
                    setForm((f) => ({ ...f, propertyId, tenantId }));
                  }}
                >
                  <option value="">Select property</option>
                  {properties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.title} — {p.address}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1">Amount</div>
                  <input
                    className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.amount}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, amount: e.target.value }))
                    }
                  />
                </label>

                {/* Currency locked to INR */}
                <label className="block">
                  <div className="mb-1">Currency</div>
                  <select
                    className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                    value={form.currency}
                    disabled
                    onChange={() => {}}
                  >
                    <option value="INR">INR</option>
                  </select>
                </label>
              </div>

              {/* Month + Year selects */}
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1">Month</div>
                  <select
                    className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                    required
                    value={form.month}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, month: Number(e.target.value) }))
                    }
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <div className="mb-1">Year</div>
                  <select
                    className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                    required
                    value={form.year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, year: Number(e.target.value) }))
                    }
                  >
                    {Array.from({ length: 7 }).map((_, i) => {
                      const y = now.getFullYear() - 2 + i; // show a small sensible range
                      return (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>

              <label className="block">
                <div className="mb-1">Due date</div>
                <input
                  className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dueDate: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <div className="mb-1">Notes (optional)</div>
                <textarea
                  className="border rounded p-2 w-full bg-white dark:bg-neutral-900"
                  rows={2}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="border rounded px-3 py-1"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
                <button className="border rounded px-3 py-1 hover:bg-gray-50 dark:hover:bg-neutral-800">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
