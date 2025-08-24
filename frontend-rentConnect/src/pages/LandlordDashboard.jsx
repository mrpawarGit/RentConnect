import React, { useEffect, useState } from "react";
import api from "../lib/api";

const LandlordDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/landlord/dashboard")
      .then((res) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.message || "Failed to fetch landlord data")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading landlord dashboard...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <section className="max-w-5xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-6">Landlord Dashboard</h2>
      <pre className="text-sm">{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
};

export default LandlordDashboard;
