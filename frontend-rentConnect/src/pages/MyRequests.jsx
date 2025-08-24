import React, { useEffect, useState } from "react";
import api from "../lib/api";

const chip = (s) =>
  s === "completed"
    ? "bg-green-100 text-green-700"
    : s === "in_progress"
    ? "bg-yellow-100 text-yellow-700"
    : "bg-gray-100 text-gray-700";

export default function MyRequests() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api.get("/maintenance/mine").then((res) => setItems(res.data));
  }, []);
  return (
    <section className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">My Maintenance Requests</h2>
      <div className="space-y-3">
        {items.map((r) => (
          <div key={r._id} className="border rounded p-4">
            <div className="flex justify-between">
              <div className="font-medium">
                {r.category.toUpperCase()} — {r.property?.title}
              </div>
              <span className={`px-2 py-1 rounded text-xs ${chip(r.status)}`}>
                {r.status.replace("_", " ")}
              </span>
            </div>
            <p className="mt-2 text-sm">{r.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
