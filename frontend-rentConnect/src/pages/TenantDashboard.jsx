import React, { useEffect, useState } from "react";
import api from "../lib/api";

const TenantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load multiple data sources in parallel (avoid duplicate /tenant/dashboard call)
        const [dashboardRes, requestsRes, invoicesRes] = await Promise.all([
          api.get("/tenant/dashboard"),
          api.get("/maintenance/mine"),
          api.get("/payments/tenant"),
        ]);

        setData(dashboardRes.data || null);
        setProperties(dashboardRes.data?.properties || []);

        // Get recent maintenance requests (last 5)
        const requests = (requestsRes.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setRecentRequests(requests);

        // Get recent invoices (next 5 upcoming + recent by nearest dueDate)
        const invoices = (invoicesRes.data || [])
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
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
      case "unpaid":
        return "text-blue-700 dark:text-blue-400 font-semibold";
      default:
        return "text-gray-800 dark:text-gray-500 font-semibold";
    }
  };

  const calculateStats = () => {
    const totalProperties = properties.length;
    const pendingRequests = recentRequests.filter(
      (r) => r.status === "pending"
    ).length;
    const inProgressRequests = recentRequests.filter(
      (r) => r.status === "in_progress"
    ).length;
    const overdueInvoices = recentInvoices.filter(
      (i) => i.status === "overdue"
    ).length;
    const upcomingPayments = recentInvoices.filter(
      (i) => i.status === "unpaid" && new Date(i.dueDate) > new Date()
    ).length;
    const nextPaymentAmount =
      recentInvoices
        .filter(
          (i) => i.status === "unpaid" && new Date(i.dueDate) > new Date()
        )
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.amount ||
      0;

    return {
      totalProperties,
      pendingRequests,
      inProgressRequests,
      overdueInvoices,
      upcomingPayments,
      nextPaymentAmount,
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
        <h1 className="text-2xl font-bold text-primary">Tenant Dashboard</h1>
        <p className="text-white-800 dark:text-black-700">
          Manage your rental experience in one place
        </p>
        <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Stats Cards (styled like LandlordDashboard) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { title: "Rentals", value: stats.totalProperties, icon: "🏠" },
          {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: "⏳",
          },
          { title: "In Progress", value: stats.inProgressRequests, icon: "🛠️" },
          {
            title: "Overdue Payments",
            value: stats.overdueInvoices,
            icon: "⚠️",
          },
          {
            title: "Upcoming Payments",
            value: stats.upcomingPayments,
            icon: "📅",
          },
          {
            title: "Next Payment",
            value: `₹${Number(stats.nextPaymentAmount || 0).toLocaleString()}`,
            icon: "💳",
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
            <h3 className="font-semibold text-primary">
              Recent Maintenance Requests
            </h3>
            <a
              href="/requests/mine"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-800 dark:text-gray-500 mb-3">
                  No maintenance requests
                </p>
                <a
                  href="/requests/new"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover"
                >
                  Report an Issue
                </a>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-start justify-between p-3 border-b border-primary/20 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-primary truncate">
                        {request.category?.toUpperCase() || "REQUEST"}
                      </p>
                      <span
                        className={`text-xs ${getStatusColor(request.status)}`}
                      >
                        {String(request.status || "").replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 dark:text-gray-500 truncate">
                      {request.description}
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-400 mt-1">
                      {request.property?.title || "Unknown Property"} •{" "}
                      {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-bg rounded-lg border border-primary p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-primary">Upcoming Payments</h3>
            <a
              href="/payments"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </a>
          </div>
          <div className="space-y-3">
            {recentInvoices.length === 0 ? (
              <p className="text-gray-800 dark:text-gray-500 text-center py-4">
                No upcoming payments
              </p>
            ) : (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="flex items-center justify-between p-3 border-b border-primary/20 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-primary truncate">
                        {invoice.property?.title || "Unknown Property"}
                      </p>
                      <span
                        className={`text-xs ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-700 dark:text-gray-400">
                        Due: {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-semibold text-primary">
                        ₹{invoice.amount?.toLocaleString() || 0}
                      </p>
                    </div>
                    {invoice.status === "overdue" && (
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        Overdue by{" "}
                        {Math.floor(
                          (new Date() - new Date(invoice.dueDate)) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rental Information */}
      <div className="bg-bg rounded-lg border border-primary p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-primary">Rental Information</h3>
        </div>
        <div>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-800 dark:text-gray-500">
                No rental properties assigned
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-400 mt-1">
                Contact your landlord if this seems incorrect
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="border border-primary/30 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-primary truncate">
                      {property.title}
                    </h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                      ₹{property.rentAmount?.toLocaleString() || 0}/mo
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 dark:text-gray-500 mb-2 line-clamp-2">
                    {property.address}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-400">
                    <span>
                      Landlord: {property.landlord?.name || "Unknown"}
                    </span>
                    <button
                      onClick={() =>
                        (window.location.href = `/chat?landlord=${property.landlord?._id}`)
                      }
                      className="text-xs bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20"
                    >
                      Message
                    </button>
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
            { title: "Report Issue", href: "/requests/new", icon: "🛠️" },
            { title: "View Payments", href: "/payments", icon: "💳" },
            { title: "My Requests", href: "/requests/mine", icon: "📋" },
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

export default TenantDashboard;
