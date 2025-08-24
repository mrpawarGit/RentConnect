import React, { useEffect, useState } from "react";
import api from "../lib/api";

const TenantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/tenant/dashboard")
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to fetch tenant data")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading tenant dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <section className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Tenant Dashboard</h2>
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
};

export default TenantDashboard;
