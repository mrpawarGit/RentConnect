import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

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
    setLoading(true);
    const { data } = await api.get("/payments/tenant");
    setInvoices(data);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);

  const today = new Date();
  const [cursor, setCursor] = useState(startOfMonth(today));
  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const arr = [];
    const cur = new Date(start);
    while (cur <= end) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [cursor]);

  function invOn(day) {
    return invoices.filter((i) => sameDay(new Date(i.dueDate), day));
  }

  async function markPaid(id) {
    await api.post(`/payments/invoice/${id}/paid`);
    await load();
  }

  async function requestDelay(id) {
    const reason = prompt("Reason for delay?");
    const newDueDate = prompt("Proposed new due date? (YYYY-MM-DD)");
    await api.post(`/payments/invoice/${id}/delay`, { reason, newDueDate });
    await load();
  }

  if (loading) return <p>Loading payments…</p>;

  return (
    <section className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Rent Calendar</h2>
        <div className="space-x-2">
          <button
            className="border rounded px-3 py-1"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
              )
            }
          >
            Prev
          </button>
          <button
            className="border rounded px-3 py-1"
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
              )
            }
          >
            Next
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs text-gray-500">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const list = invOn(day);
          return (
            <div
              key={i}
              className={`border rounded p-2 min-h-[90px] ${
                sameDay(day, today) ? "border-blue-500" : ""
              }`}
            >
              <div className="text-xs text-gray-600">{day.getDate()}</div>
              <div className="space-y-1 mt-1">
                {list.map((inv) => (
                  <div
                    key={inv._id}
                    className={`text-[11px] px-1 py-0.5 rounded ${badge(
                      inv.status
                    )}`}
                    title={`${inv.property?.title} • ${inv.amount} ${inv.currency}`}
                  >
                    {inv.amount} {inv.currency}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
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
                  <td className="p-3">{inv.property?.title}</td>
                  <td className="p-3">
                    {new Date(inv.periodStart).toLocaleDateString()} –{" "}
                    {new Date(inv.periodEnd).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    {new Date(inv.dueDate).toLocaleDateString()}
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
                  <td className="p-6 text-center text-gray-500" colSpan="6">
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
