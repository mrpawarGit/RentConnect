import React, { useEffect, useState } from "react";
import TenantDashboard from "./TenantDashboard";
import LandlordDashboard from "./LandlordDashboard";
import { Navigate } from "react-router-dom";

const DashboardRouter = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const { role } = JSON.parse(jsonPayload);
      setRole(role);
    } catch {
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!role) return <Navigate to="/login" replace />;

  return role === "tenant" ? <TenantDashboard /> : <LandlordDashboard />;
};

export default DashboardRouter;
