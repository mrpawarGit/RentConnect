import React from "react";

export default function About() {
  return (
    <main className="bg-bg min-h-[60vh] flex items-center justify-center">
      <section className="mx-auto max-w-4xl px-5 sm:px-6 lg:px-8 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">About RentConnect</h1>
          <p className="mt-2 opacity-70">
            A modern tenant–landlord communication platform that makes property
            management transparent, fast, and stress-free.
          </p>
        </header>

        <div className="prose prose-invert max-w-none">
          <p className="opacity-80">
            RentConnect was built to remove friction from property management.
            From <strong>quick chats</strong> to{" "}
            <strong>maintenance tracking</strong>,
            <strong> rent payments</strong>, and <strong>scheduling</strong>,
            our mission is to create a calm, organized experience that respects
            everyone’s time.
          </p>

          <p className="opacity-80 mt-4">
            Powered by <strong>React (Vite)</strong> on the frontend and
            <strong> Node.js + Express + MongoDB</strong> on the backend,
            RentConnect delivers a responsive, mobile-first experience with
            real-time communication powered by <strong>Socket.IO</strong>.
          </p>

          <p className="opacity-80 mt-4">
            Security and privacy are at the core of RentConnect. With{" "}
            <strong>JWT authentication</strong>, secure file uploads, and
            role-based access, both tenants and landlords can interact safely
            and confidently.
          </p>

          <p className="opacity-80 mt-4">
            Looking ahead, we’re building{" "}
            <strong>multi-language support</strong>,
            <strong> push notifications</strong>, advanced reporting with
            CSV/PDF export, and calendar sync to make collaboration even more
            seamless.
          </p>
        </div>
      </section>
    </main>
  );
}
