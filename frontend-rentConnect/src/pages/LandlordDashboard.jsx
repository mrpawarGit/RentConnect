import React, { useEffect, useState } from "react";
import api from "../lib/api";

const LandlordDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [propertiesRes, requestsRes, invoicesRes] = await Promise.all([
          api.get("/properties"),
          api.get("/maintenance/landlord"),
          api.get("/payments/landlord"),
        ]);

        setProperties(propertiesRes.data || []);

        // Get recent maintenance requests (last 3)
        const requests = (requestsRes.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentRequests(requests);

        // Get recent invoices (last 3)
        const invoices = (invoicesRes.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3);
        setRecentInvoices(invoices);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
      case "completed":
        return "text-green-700 dark:text-green-400 font-semibold";
      case "overdue":
        return "text-red-700 dark:text-red-400 font-semibold";
      case "pending":
      case "in_progress":
        return "text-blue-700 dark:text-blue-400 font-semibold";
      default:
        return "text-gray-800 dark:text-gray-500 font-semibold";
    }
  };

  const calculateStats = () => {
    const totalProperties = properties.length;
    const totalTenants = properties.reduce(
      (sum, p) => sum + (p.tenants?.length || 0),
      0
    );
    const pendingRequests = recentRequests.filter(
      (r) => r.status === "pending"
    ).length;
    const overdueInvoices = recentInvoices.filter(
      (i) => i.status === "overdue"
    ).length;
    const monthlyRevenue = recentInvoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + (i.amount || 0), 0);

    return {
      totalProperties,
      totalTenants,
      pendingRequests,
      overdueInvoices,
      monthlyRevenue,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/20 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <section className="max-w-6xl mx-auto p-4 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
        <p className="text-white-800 dark:text-black-700">
          Overview of your properties and activities
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[
          { title: "Properties", value: stats.totalProperties, icon: "🏠" },
          { title: "Tenants", value: stats.totalTenants, icon: "👥" },
          {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: "🔧",
          },
          {
            title: "Overdue Invoices",
            value: stats.overdueInvoices,
            icon: "💰",
          },
          {
            title: "Monthly Revenue",
            value: `₹${stats.monthlyRevenue.toLocaleString()}`,
            icon: "📈",
          },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-bg p-4 rounded-lg border border-primary"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 dark:text-gray-500">
                  {stat.title}
                </p>
                <p className="text-lg font-semibold text-primary">
                  {stat.value}
                </p>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Maintenance Requests */}
        <div className="bg-bg rounded-lg border border-primary p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Recent Requests</h3>
            <a
              href="/requests/admin"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-gray-800 dark:text-gray-500 text-center py-4">
                No recent requests
              </p>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-start justify-between p-3 border-b border-primary/20 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-primary truncate">
                        {request.property?.title || "Unknown Property"}
                      </p>
                      <span
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-500 truncate">
                      {request.description}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                      {request.tenant?.name} •{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-bg rounded-lg border border-primary p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Recent Invoices</h3>
            <a
              href="/payments/admin"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-gray-800 dark:text-gray-500 text-center py-4">
                No recent invoices
              </p>
            ) : (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-3 border-b border-primary/20 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-primary">
                        {invoice.tenant?.name || "Unknown Tenant"}
                      </p>
                      <span
                        className={`text-xs ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-500">
                      {invoice.property?.title || "Unknown Property"}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-700 dark:text-gray-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        ₹{invoice.amount?.toLocaleString() || 0}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Properties Overview */}
      <div className="bg-bg rounded-lg border border-primary p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">Properties</h3>
          <a
            href="/properties/admin"
            className="text-sm text-primary hover:underline"
          >
            Manage all →
          </a>
        </div>
        <div>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-800 dark:text-gray-500 mb-4">
                No properties yet
              </p>
              <a
                href="/properties/admin"
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                Add your first property
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {properties.slice(0, 4).map((property) => (
                <div
                  key={property._id}
                  className="border border-primary/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-primary truncate">
                      {property.title}
                    </h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2">
                      ₹{property.rentAmount?.toLocaleString() || 0}/mo
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-500 mb-2 line-clamp-2">
                    {property.address}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-400">
                    <span>{property.tenants?.length || 0} tenants</span>
                    <span>ID: {property._id.slice(-6)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-bg rounded-lg border border-primary p-4">
        <h3 className="font-semibold text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { title: "Add Property", href: "/properties/admin", icon: "➕" },
            { title: "Create Invoice", href: "/payments/admin", icon: "💸" },
            { title: "View Requests", href: "/requests/admin", icon: "🔧" },
            { title: "Messages", href: "/chat", icon: "💬" },
          ].map((action, index) => (
            <a
              key={index}
              href={action.href}
              className="flex flex-col items-center p-3 border border-primary/30 rounded-lg hover:border-primary hover:bg-primary/5 transition-all"
            >
              <span className="text-2xl mb-2">{action.icon}</span>
              <span className="text-sm text-primary text-center">
                {action.title}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandlordDashboard;
