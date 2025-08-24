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
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-primary">
            Streamline Tenant & Landlord Communication
          </h1>
          <p className="text-lg md:text-xl text-gray-800 dark:text-gray-400 max-w-3xl mx-auto">
            Manage maintenance, payments, and messages in one intuitive platform
            with real-time updates and complete transparency.
          </p>

          {/* CTA Area */}
          {!loading && !user ? (
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="px-6 py-3 bg-primary text-white rounded-lg shadow hover:bg-primary-hover transition"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
              >
                Login
              </Link>
            </div>
          ) : !loading && user ? (
            <div className="flex items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="px-6 py-3 bg-primary text-white rounded-lg shadow hover:bg-primary-hover transition"
              >
                Open Dashboard
              </Link>
              <div className="hidden md:flex gap-2">
                <Link
                  to="/requests/new"
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
                >
                  Report Issue
                </Link>
                <Link
                  to="/payments"
                  className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
                >
                  View Payments
                </Link>
              </div>
            </div>
          ) : null}

          {/* Trust / Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10">
            {[
              { label: "Active Rentals", value: "2k+", icon: "🏠" },
              { label: "Issues Resolved", value: "15k+", icon: "🛠️" },
              { label: "On-time Payments", value: "98%", icon: "💳" },
              { label: "Avg. Response", value: "< 2h", icon: "⚡" },
            ].map((s, i) => (
              <div
                key={i}
                className="bg-bg p-4 rounded-lg border border-primary/20 flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="text-xs text-gray-800 dark:text-gray-500">
                    {s.label}
                  </p>
                  <p className="text-2xl font-semibold text-primary">
                    {s.value}
                  </p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
          Everything you need to stay in sync
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              className="bg-bg p-5 rounded-lg border border-primary/30"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-primary">{f.title}</h3>
                <span className="text-2xl">{f.icon}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-gray-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-bg border-y border-primary/20">
        <div className="max-w-6xl mx-auto px-6 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
            How RentConnect works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                step: 1,
                title: "Sign up or Login",
                desc: "Create an account or sign in to your existing one.",
              },
              {
                step: 2,
                title: "Report & Track",
                desc: "Submit maintenance requests with details and track progress in real time.",
              },
              {
                step: 3,
                title: "Chat & Pay",
                desc: "Message your landlord and stay on top of rent with reminders and history.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-5 rounded-lg border border-primary/30"
              >
                <div className="text-xs text-gray-800 dark:text-gray-500 mb-1">
                  Step {s.step}
                </div>
                <h3 className="font-semibold text-primary mb-1">{s.title}</h3>
                <p className="text-sm text-gray-800 dark:text-gray-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles / Persona cards */}
      <section id="roles" className="max-w-6xl mx-auto px-6 py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-primary text-center mb-8">
          Built for tenants and landlords
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tenant card */}
          <div className="border border-primary/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-primary">For Tenants</h3>
              <span className="text-2xl">👩‍💼</span>
            </div>
            <ul className="text-sm text-gray-800 dark:text-gray-500 space-y-2 list-disc list-inside">
              <li>Report issues with images/videos</li>
              <li>Track requests with clear statuses</li>
              <li>Get rent reminders & history</li>
              <li>Message your landlord instantly</li>
            </ul>
            {/* <div className="mt-4 flex gap-2">
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
              >
                Get Started
              </Link>
              <Link
                to="/requests/new"
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
              >
                Report Issue
              </Link>
            </div> */}
          </div>

          {/* Landlord card */}
          <div className="border border-primary/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-primary">For Landlords</h3>
              <span className="text-2xl">🧑‍🔧</span>
            </div>
            <ul className="text-sm text-gray-800 dark:text-gray-500 space-y-2 list-disc list-inside">
              <li>Filter issues by property, urgency, or status</li>
              <li>Update progress and notify tenants</li>
              <li>Export maintenance history (CSV/PDF)</li>
              <li>Monitor rent payments across properties</li>
            </ul>
            {/* <div className="mt-4 flex gap-2">
              <Link
                to="/register"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition"
              >
                Create Accountt
              </Link>
              <Link
                to="/payments/admin"
                className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition"
              >
                View Payments
              </Link>
            </div> */}
          </div>
        </div>
      </section>
    </main>
  );
}
