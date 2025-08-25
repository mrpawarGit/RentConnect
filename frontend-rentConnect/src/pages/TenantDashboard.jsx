import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/api";
import { API_BASE_URL } from "../lib/config";

const TenantDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [properties, setProperties] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load multiple data sources in parallel
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
        console.error("Dashboard loading error:", err);
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to fetch dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload data
      const [dashboardRes, requestsRes, invoicesRes] = await Promise.all([
        api.get("/tenant/dashboard"),
        api.get("/maintenance/mine"),
        api.get("/payments/tenant"),
      ]);

      setData(dashboardRes.data || null);
      setProperties(dashboardRes.data?.properties || []);
      setRecentRequests(
        (requestsRes.data || [])
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
      );
      setRecentInvoices(
        (invoicesRes.data || [])
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5)
      );
      setError(null);
    } catch (err) {
      console.error("Refresh error:", err);
      setError("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
      case "completed":
        return "text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-semibold";
      case "overdue":
        return "text-red-700 bg-red-100 px-2 py-1 rounded-full text-xs font-semibold";
      case "pending":
      case "in_progress":
      case "unpaid":
        return "text-blue-700 bg-blue-100 px-2 py-1 rounded-full text-xs font-semibold";
      default:
        return "text-gray-700 bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold";
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case "high":
        return "text-red-600 font-semibold";
      case "medium":
        return "text-yellow-600 font-semibold";
      case "low":
        return "text-green-600 font-semibold";
      default:
        return "text-gray-600";
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <span className="text-red-600 text-xl mr-3">⚠️</span>
            <div>
              <h3 className="text-red-800 font-semibold">
                Failed to load dashboard
              </h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={handleRefresh}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <section className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">Tenant Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage your rental experience in one place
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {refreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Refreshing...
            </>
          ) : (
            <>
              <span className="mr-2">🔄</span>
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          {
            title: "Rentals",
            value: stats.totalProperties,
            icon: "🏠",
            color: "bg-blue-50 border-blue-200",
          },
          {
            title: "Pending Requests",
            value: stats.pendingRequests,
            icon: "⏳",
            color: "bg-yellow-50 border-yellow-200",
          },
          {
            title: "In Progress",
            value: stats.inProgressRequests,
            icon: "🛠️",
            color: "bg-orange-50 border-orange-200",
          },
          {
            title: "Overdue Payments",
            value: stats.overdueInvoices,
            icon: "⚠️",
            color: "bg-red-50 border-red-200",
          },
          {
            title: "Upcoming Payments",
            value: stats.upcomingPayments,
            icon: "📅",
            color: "bg-green-50 border-green-200",
          },
          {
            title: "Next Payment",
            value: formatCurrency(stats.nextPaymentAmount),
            icon: "💳",
            color: "bg-purple-50 border-purple-200",
          },
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} p-4 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  {stat.title}
                </p>
                <p className="text-lg font-bold text-gray-900 mt-1">
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              Recent Maintenance Requests
            </h3>
            <Link
              to="/requests/mine"
              className="text-sm text-primary hover:text-primary-hover font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentRequests.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🛠️</span>
                <p className="text-gray-500 mb-4">
                  No maintenance requests yet
                </p>
                <Link
                  to="/requests/new"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Report an Issue
                </Link>
              </div>
            ) : (
              recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 truncate">
                          {request.category?.toUpperCase() || "REQUEST"}
                        </p>
                        <span className={getStatusColor(request.status)}>
                          {String(request.status || "").replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          {request.property?.title || "Unknown Property"}
                        </span>
                        <span>{getTimeAgo(request.createdAt)}</span>
                      </div>
                      {request.urgency && (
                        <p
                          className={`text-xs mt-1 ${getUrgencyColor(
                            request.urgency
                          )}`}
                        >
                          {request.urgency.toUpperCase()} PRIORITY
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-lg">
              Upcoming Payments
            </h3>
            <Link
              to="/payments"
              className="text-sm text-primary hover:text-primary-hover font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="space-y-4">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">💳</span>
                <p className="text-gray-500">No upcoming payments</p>
              </div>
            ) : (
              recentInvoices.map((invoice) => (
                <div
                  key={invoice._id}
                  className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900 truncate">
                      {invoice.property?.title || "Unknown Property"}
                    </p>
                    <span className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Due: {formatDate(invoice.dueDate)}
                    </p>
                    <p className="text-lg font-bold text-primary">
                      {formatCurrency(invoice.amount)}
                    </p>
                  </div>
                  {invoice.status === "overdue" && (
                    <p className="text-xs text-red-600 mt-2 font-medium">
                      Overdue by{" "}
                      {Math.floor(
                        (new Date() - new Date(invoice.dueDate)) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      days
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rental Information */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-lg">
            Rental Information
          </h3>
        </div>
        <div>
          {properties.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-4xl mb-4 block">🏠</span>
              <p className="text-gray-500 mb-2">
                No rental properties assigned
              </p>
              <p className="text-sm text-gray-400">
                Contact your landlord if this seems incorrect
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <div
                  key={property._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {property.title}
                    </h4>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full ml-2 whitespace-nowrap font-medium">
                      {formatCurrency(property.rentAmount)}/mo
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {property.address}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Landlord: {property.landlord?.name || "Unknown"}
                    </span>
                    <Link
                      to={`/chat?landlord=${property.landlord?._id}`}
                      className="text-xs bg-primary text-white px-3 py-1 rounded hover:bg-primary-hover transition-colors"
                    >
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 text-lg mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { title: "Report Issue", to: "/requests/new", icon: "🛠️" },
            { title: "View Payments", to: "/payments", icon: "💳" },
            { title: "My Requests", to: "/requests/mine", icon: "📋" },
            { title: "Messages", to: "/chat", icon: "💬" },
          ].map((action, index) => (
            <Link
              key={index}
              to={action.to}
              className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-all group"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </span>
              <span className="text-sm text-gray-700 group-hover:text-primary text-center font-medium">
                {action.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TenantDashboard;
