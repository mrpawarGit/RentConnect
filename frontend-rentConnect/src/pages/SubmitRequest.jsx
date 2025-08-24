import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const COMMON_ISSUES = {
  plumbing: [
    "Leaky faucet",
    "Clogged drain",
    "Running toilet",
    "Low water pressure",
  ],
  electrical: ["Power outage in room", "Faulty outlet", "Flickering lights"],
  hvac: ["AC not cooling", "Heater not working", "Strange noise from unit"],
  appliances: ["Fridge not cooling", "Washer not spinning", "Oven not heating"],
  general: ["Door lock issue", "Window won’t close", "Pest sighting"],
};

export default function SubmitRequest() {
  const [properties, setProperties] = useState([]);
  const [form, setForm] = useState({
    propertyId: "",
    category: "general",
    urgency: "low",
    description: "",
  });
  const [files, setFiles] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    // load tenant dashboard to infer properties (simple reuse)
    api.get("/tenant/dashboard").then((res) => {
      setProperties(res.data.properties || []);
    });
  }, []);

  // autosuggest
  useEffect(() => {
    const pool = COMMON_ISSUES[form.category] || [];
    const q = form.description.toLowerCase();
    setSuggestions(
      q.length < 2
        ? []
        : pool.filter((x) => x.toLowerCase().includes(q)).slice(0, 5)
    );
  }, [form.category, form.description]);

  function onDrop(e) {
    e.preventDefault();
    const list = Array.from(e.dataTransfer.files);
    setFiles((prev) => prev.concat(list).slice(0, 5));
  }

  async function submit(e) {
    e.preventDefault();
    if (!form.propertyId || !form.description) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    files.forEach((f) => fd.append("files", f));

    const { data } = await api.post("/maintenance", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    alert("Request submitted!");
    setForm({
      propertyId: "",
      category: "general",
      urgency: "low",
      description: "",
    });
    setFiles([]);
  }

  return (
    <section className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">
        Report a Maintenance Issue
      </h2>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="block mb-1">Property</span>
          <select
            className="w-full border rounded p-2"
            value={form.propertyId}
            onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
            required
          >
            <option value="">Select a property</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.title} — {p.address}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block mb-1">Category</span>
            <select
              className="w-full border rounded p-2"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {Object.keys(COMMON_ISSUES).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block mb-1">Urgency</span>
            <select
              className="w-full border rounded p-2"
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="block mb-1">Describe the issue</span>
          <textarea
            className="w-full border rounded p-2"
            rows="4"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g., water leaking under the sink"
            required
          />
        </label>

        {suggestions.length > 0 && (
          <div className="border rounded p-2 text-sm">
            <p className="font-medium mb-1">Suggestions:</p>
            <div className="flex gap-2 flex-wrap">
              {suggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  className="px-2 py-1 border rounded"
                  onClick={() => setForm((f) => ({ ...f, description: s }))}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="border-dashed border-2 rounded p-6 text-center"
        >
          <p>Drag & drop images/videos here (max 5), or click to select</p>
          <input
            type="file"
            multiple
            className="hidden"
            id="file-input"
            onChange={(e) => setFiles(Array.from(e.target.files))}
          />
          <label
            htmlFor="file-input"
            className="inline-block mt-2 px-3 py-1 border rounded cursor-pointer"
          >
            Browse…
          </label>
          {files.length > 0 && (
            <ul className="mt-3 text-sm list-disc list-inside">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>
          )}
        </div>

        <button className="px-4 py-2 bg-primary text-custom rounded hover-bg-primary">
          Submit
        </button>
      </form>
    </section>
  );
}
