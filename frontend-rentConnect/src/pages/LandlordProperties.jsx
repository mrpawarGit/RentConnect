import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api";

export default function LandlordProperties() {
  const [items, setItems] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "",
    address: "",
    rentAmount: "",
    description: "",
  });
  const [search, setSearch] = useState("");

  const [manage, setManage] = useState(null); // property to manage tenants
  const [tenantEmail, setTenantEmail] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await api.get("/properties");
    setItems(data);
  }
  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      `${p.title} ${p.address}`.toLowerCase().includes(q)
    );
  }, [items, search]);

  async function createProperty(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: createForm.title,
        address: createForm.address,
        description: createForm.description,
        rentAmount: Number(createForm.rentAmount || 0),
      };
      await api.post("/properties", payload);
      setShowCreate(false);
      setCreateForm({
        title: "",
        address: "",
        rentAmount: "",
        description: "",
      });
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function updateProperty(id, patch) {
    setSaving(true);
    try {
      await api.patch(`/properties/${id}`, patch);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function deleteProperty(id) {
    if (!confirm("Delete this property?")) return;
    setSaving(true);
    try {
      await api.delete(`/properties/${id}`);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function addTenant(propId) {
    if (!tenantEmail) return;
    setSaving(true);
    try {
      await api.post(`/properties/${propId}/tenants`, { email: tenantEmail });
      setTenantEmail("");
      await load();
      // refresh manage pane
      const fresh = (await api.get("/properties")).data.find(
        (p) => p._id === propId
      );
      setManage(fresh || null);
    } finally {
      setSaving(false);
    }
  }

  async function removeTenant(propId, tenantId) {
    setSaving(true);
    try {
      await api.delete(`/properties/${propId}/tenants/${tenantId}`);
      const fresh = (await api.get("/properties")).data.find(
        (p) => p._id === propId
      );
      setManage(fresh || null);
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Properties</h2>
        <div className="flex gap-2">
          <input
            className="border rounded p-2"
            placeholder="Search properties…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="border rounded px-3 py-1"
            onClick={() => setShowCreate(true)}
          >
            Add Property
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p._id} className="border rounded p-4 flex flex-col">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-semibold">{p.title}</div>
                <div className="text-sm text-gray-600">{p.address}</div>
                <div className="text-sm mt-1">
                  Rent: <span className="font-medium">{p.rentAmount}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-sm underline"
                  onClick={() => setManage(p)}
                >
                  Manage
                </button>
                <button
                  className="text-sm underline text-red-600"
                  onClick={() => deleteProperty(p._id)}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-700 line-clamp-3">
              {p.description}
            </div>

            <div className="mt-3">
              <div className="text-xs text-gray-500 mb-1">Tenants</div>
              <ul className="text-sm space-y-1">
                {(p.tenants || []).map((t) => (
                  <li key={t._id} className="flex justify-between items-center">
                    <span>
                      {t.name}{" "}
                      <span className="text-gray-500">({t.email})</span>
                    </span>
                    <button
                      className="text-xs underline text-red-600"
                      onClick={() => removeTenant(p._id, t._id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
                {(!p.tenants || p.tenants.length === 0) && (
                  <li className="text-gray-500">No tenants yet</li>
                )}
              </ul>
            </div>

            <div className="mt-3">
              <button
                className="border rounded px-3 py-1 text-sm"
                onClick={() => {
                  const title = prompt("Update title", p.title);
                  if (title && title !== p.title)
                    updateProperty(p._id, { title });
                }}
              >
                Edit Title
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-500 border rounded p-8">
            No properties found. Click “Add Property” to create one.
          </div>
        )}
      </div>

      {/* Create property modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black border rounded p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Property</h3>
              <button
                onClick={() => setShowCreate(false)}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={createProperty} className="space-y-3">
              <label className="block">
                <div className="mb-1">Title</div>
                <input
                  className="border rounded p-2 w-full"
                  required
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <div className="mb-1">Address</div>
                <input
                  className="border rounded p-2 w-full"
                  required
                  value={createForm.address}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, address: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <div className="mb-1">Monthly Rent</div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="border rounded p-2 w-full"
                  required
                  value={createForm.rentAmount}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, rentAmount: e.target.value }))
                  }
                />
              </label>

              <label className="block">
                <div className="mb-1">Description (optional)</div>
                <textarea
                  className="border rounded p-2 w-full"
                  rows="3"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      description: e.target.value,
                    }))
                  }
                />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="border rounded px-3 py-1"
                  onClick={() => setShowCreate(false)}
                >
                  Cancel
                </button>
                <button
                  className="border rounded px-3 py-1 hover:bg-gray-50"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage tenants modal */}
      {manage && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-black border rounded p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Manage Tenants — {manage.title}
              </h3>
              <button
                onClick={() => setManage(null)}
                className="text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600 mb-1">
                  Current Tenants
                </div>
                <ul className="text-sm space-y-1">
                  {(manage.tenants || []).map((t) => (
                    <li
                      key={t._id}
                      className="flex justify-between items-center"
                    >
                      <span>
                        {t.name}{" "}
                        <span className="text-gray-500">({t.email})</span>
                      </span>
                      <button
                        className="text-xs underline text-red-600"
                        onClick={() => removeTenant(manage._id, t._id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                  {(!manage.tenants || manage.tenants.length === 0) && (
                    <li className="text-gray-500">No tenants yet</li>
                  )}
                </ul>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm mb-1">
                  Add tenant by email (must be registered as tenant)
                </div>
                <div className="flex gap-2">
                  <input
                    className="border rounded p-2 flex-1"
                    placeholder="tenant@example.com"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                  />
                  <button
                    className="border rounded px-3 py-1"
                    disabled={!tenantEmail || saving}
                    onClick={() => addTenant(manage._id)}
                  >
                    {saving ? "Adding..." : "Add"}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  className="border rounded px-3 py-1"
                  onClick={() => setManage(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
