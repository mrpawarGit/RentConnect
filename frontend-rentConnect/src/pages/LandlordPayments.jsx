import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

export default function LandlordPayments() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState({ status: "", q: "" });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    tenantId: "",
    propertyId: "",
    amount: "",
    currency: "USD",
    periodStart: "",
    periodEnd: "",
    dueDate: "",
    notes: "",
  });
  const [properties, setProperties] = useState([]);

  async function load() {
    const [inv, props] = await Promise.all([
      api.get("/payments/landlord"),
      api.get("/properties"),
    ]);
    setItems(inv.data);
    setProperties(props.data);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (filter.status && i.status !== filter.status) return false;
      if (filter.q) {
        const t = filter.q.toLowerCase();
        const hay =
          `${i.tenant?.name} ${i.property?.title} ${i.amount} ${i.currency}`.toLowerCase();
        if (!hay.includes(t)) return false;
      }
      return true;
    });
  }, [items, filter]);

  async function createInvoice(e) {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    await api.post("/payments/invoice", payload);
    setShowForm(false);
    setForm({
      tenantId: "",
      propertyId: "",
      amount: "",
      currency: "USD",
      periodStart: "",
      periodEnd: "",
      dueDate: "",
      notes: "",
    });
    await load();
  }

  async function approveDelay(id, approve) {
    let newDueDate = undefined;
    if (approve) {
      const input = prompt("New due date (YYYY-MM-DD) or leave blank:");
      if (input) newDueDate = input;
    }
    await api.post(`/payments/invoice/${id}/approve-delay`, {
      approve,
      newDueDate,
    });
    await load();
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
                <td className="p-3">{i.tenant?.name}</td>
                <td className="p-3">{i.property?.title}</td>
                <td className="p-3">
                  {new Date(i.periodStart).toLocaleDateString()} –{" "}
                  {new Date(i.periodEnd).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {new Date(i.dueDate).toLocaleDateString()}
                </td>
                <td className="p-3">
                  {i.amount} {i.currency}
                </td>
                <td className="p-3">{i.status}</td>
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
                <td className="p-6 text-center text-gray-500" colSpan="7">
                  No invoices.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create invoice modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black border rounded p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create Invoice</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={createInvoice} className="space-y-3">
              <label className="block">
                <div className="mb-1">Property (auto sets landlord)</div>
                <select
                  className="border rounded p-2 w-full"
                  required
                  value={form.propertyId}
                  onChange={(e) => {
                    const propertyId = e.target.value;
                    const prop = properties.find((p) => p._id === propertyId);
                    // Pick first tenant from property for now (can improve to select)
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
                    className="border rounded p-2 w-full"
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
                <label className="block">
                  <div className="mb-1">Currency</div>
                  <input
                    className="border rounded p-2 w-full"
                    value={form.currency}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, currency: e.target.value }))
                    }
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className="mb-1">Period start</div>
                  <input
                    className="border rounded p-2 w-full"
                    type="date"
                    required
                    value={form.periodStart}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodStart: e.target.value }))
                    }
                  />
                </label>
                <label className="block">
                  <div className="mb-1">Period end</div>
                  <input
                    className="border rounded p-2 w-full"
                    type="date"
                    required
                    value={form.periodEnd}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, periodEnd: e.target.value }))
                    }
                  />
                </label>
              </div>

              <label className="block">
                <div className="mb-1">Due date</div>
                <input
                  className="border rounded p-2 w-full"
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
                  className="border rounded p-2 w-full"
                  rows="2"
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
                <button className="border rounded px-3 py-1 hover:bg-gray-50">
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
