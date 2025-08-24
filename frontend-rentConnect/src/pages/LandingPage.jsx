import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../lib/api";

export default function LandingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data || null);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <main className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative overflow-hidden m-16">
        {/* Decorative blobs */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-primary opacity-10 blur-3xl" />
          <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-primary opacity-10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 text-center space-y-6">
          <h1 className="mx-auto max-w-3xl text-3xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight">
            Streamline Tenant & Landlord Communication
          </h1>
          <p className="mx-auto max-w-2xl text-base sm:text-lg lg:text-xl opacity-80">
            Manage maintenance, payments, and messages in one intuitive platform
            with real-time updates and complete transparency.
          </p>

          {/* CTA Area */}
          {!loading && !user ? (
            <div></div>
          ) : !loading && user ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-white shadow transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/70"
              >
                Open Dashboard
              </Link>
              <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                <Link
                  to="/requests/new"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-primary text-primary transition bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30"
                >
                  Report Issue
                </Link>
                <Link
                  to="/payments"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-primary text-primary transition bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/30"
                >
                  View Payments
                </Link>
              </div>
            </div>
          ) : null}

          {/* Trust / Stats */}
          <div className="mx-auto grid max-w-3xl grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-8">
            {[
              { label: "Active Rentals", value: "2k+", icon: "🏠" },
              { label: "Issues Resolved", value: "15k+", icon: "🛠️" },
              { label: "On-time Payments", value: "98%", icon: "💳" },
              { label: "Avg. Response", value: "< 2h", icon: "⚡" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-bg backdrop-blur p-4 rounded-2xl border border-primary flex items-center justify-between shadow-sm"
              >
                <div className="text-left">
                  <p className="text-[11px] sm:text-xs opacity-70">{s.label}</p>
                  <p className="text-xl sm:text-2xl font-semibold text-primary">
                    {s.value}
                  </p>
                </div>
                <span className="text-2xl" aria-hidden>
                  {s.icon}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section
        id="features"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6 sm:mb-8">
          Everything you need to stay in sync
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[
            {
              title: "Intuitive Maintenance",
              desc: "Report issues with categories, urgency, and attachments. Real-time validation keeps things tidy.",
              icon: "🧰",
            },
            {
              title: "Issue Tracking",
              desc: "Follow requests from pending to completed with clear status badges and timelines.",
              icon: "📊",
            },
            {
              title: "Instant Messaging",
              desc: "Tenant–landlord threads with delivered/read receipts and timestamps.",
              icon: "💬",
            },
            {
              title: "Maintenance History",
              desc: "View historical requests per property and export reports as CSV or PDF.",
              icon: "🗂️",
            },
            {
              title: "Rent Tracker",
              desc: "Calendar view of due dates, payment history, and interactive reminders.",
              icon: "🗓️",
            },
            {
              title: "Mobile Ready",
              desc: "Responsive, touch-friendly UI that feels great on phones and desktops.",
              icon: "📱",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-bg p-5 rounded-2xl border border-primary hover:border-primary/40 transition shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-primary">{f.title}</h3>
                <span className="text-2xl" aria-hidden>
                  {f.icon}
                </span>
              </div>
              <p className="text-sm opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles / Persona cards */}
      <section
        id="roles"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14"
      >
        <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-6 sm:mb-8">
          Built for tenants and landlords
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Tenant card */}
          <div className="border border-primary rounded-2xl p-5 bg-bg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-primary">For Tenants</h3>
              <span className="text-2xl" aria-hidden>
                👩‍💼
              </span>
            </div>
            <ul className="text-sm opacity-80 space-y-2 list-disc list-inside">
              <li>Report issues with images/videos</li>
              <li>Track requests with clear statuses</li>
              <li>Get rent reminders & history</li>
              <li>Message your landlord instantly</li>
            </ul>
          </div>

          {/* Landlord card */}
          <div className="border border-primary rounded-2xl p-5 bg-bg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-primary">For Landlords</h3>
              <span className="text-2xl" aria-hidden>
                🧑‍🔧
              </span>
            </div>
            <ul className="text-sm opacity-80 space-y-2 list-disc list-inside">
              <li>Filter issues by property, urgency, or status</li>
              <li>Update progress and notify tenants</li>
              <li>Export maintenance history (CSV/PDF)</li>
              <li>Monitor rent payments across properties</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
