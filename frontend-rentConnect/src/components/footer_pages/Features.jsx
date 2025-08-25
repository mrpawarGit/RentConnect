import React from "react";

export default function Features() {
  const items = [
    {
      title: "Intuitive Maintenance Requests",
      desc: "Step-by-step forms with categories, urgency levels, drag-and-drop uploads, and real-time validation.",
    },
    {
      title: "Issue Tracking Dashboards",
      desc: "Tenants track request status; landlords filter and manage requests across multiple properties.",
    },
    {
      title: "Instant Messaging",
      desc: "Real-time tenant–landlord chat with delivery & read receipts, notifications, and timestamps.",
    },
    {
      title: "Rent Payment Tracker",
      desc: "View payment history, due dates, and request delays. Landlords monitor overdue payments easily.",
    },
    {
      title: "Scheduling & Appointments",
      desc: "Tenants propose repair slots, landlords approve or reschedule, with real-time updates on technician ETA.",
    },
    {
      title: "Multi-Language & Profiles",
      desc: "Tenant avatars, landlord multi-property console, and language toggle scaffold for global audiences.",
    },
  ];

  return (
    <main className="bg-bg min-h-[60vh]">
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold text-center text-primary">
            Features
          </h1>
          <p className="mt-2 opacity-70 text-center">
            RentConnect covers everything from chat to payments, so property
            management feels effortless.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-primary/20 p-6 hover:shadow-md transition-shadow bg-bg/50"
            >
              <h3 className="text-lg font-semibold text-primary">{f.title}</h3>
              <p className="mt-2 text-sm opacity-80">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
