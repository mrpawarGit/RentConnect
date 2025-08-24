// frontend-rentConnect/src/pages/TenantPayments.jsx

import React, { useEffect, useState } from "react";
import api from "../lib/api";

const badge = (s) =>
  s === "paid"
    ? "bg-green-100 text-green-700"
    : s === "overdue"
    ? "bg-red-100 text-red-700"
    : s === "delayed"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

export default function TenantPayments() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const { data } = await api.get("/payments/tenant");
      setInvoices(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markPaid(id) {
    try {
      await api.post(`/payments/invoice/${id}/paid`);
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to mark as paid. Please try again.");
    }
  }

  async function requestDelay(id) {
    const reason = prompt("Reason for delay?");
    if (reason === null) return; // user cancelled

    const newDueDate = prompt("Proposed new due date? (YYYY-MM-DD)");
    if (newDueDate === null) return; // user cancelled
    if (!newDueDate || isNaN(Date.parse(newDueDate))) {
      alert("Please enter a valid date in YYYY-MM-DD format.");
      return;
    }

    try {
      await api.post(`/payments/invoice/${id}/delay`, { reason, newDueDate });
      await load();
    } catch (e) {
      console.error(e);
      alert("Failed to request delay. Please try again.");
    }
  }

  if (loading) return <p>Loading payments…</p>;

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Rent Invoices</h2>
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-3">All Invoices</h3>
        <div className="overflow-x-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left">Property</th>
                <th className="p-3 text-left">Period</th>
                <th className="p-3 text-left">Due</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv._id} className="border-t">
                  <td className="p-3">{inv.property?.title || "—"}</td>
                  <td className="p-3">
                    {inv.periodStart
                      ? new Date(inv.periodStart).toLocaleDateString()
                      : "—"}{" "}
                    –{" "}
                    {inv.periodEnd
                      ? new Date(inv.periodEnd).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    {inv.dueDate
                      ? new Date(inv.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="p-3">
                    {inv.amount} {inv.currency}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded ${badge(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 space-x-2">
                    {inv.status !== "paid" && (
                      <>
                        <button
                          onClick={() => markPaid(inv._id)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Mark Paid
                        </button>
                        <button
                          onClick={() => requestDelay(inv._id)}
                          className="px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Request Delay
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {invoices.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={6}>
                    No invoices yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
