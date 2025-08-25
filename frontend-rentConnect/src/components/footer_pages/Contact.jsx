import React, { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(null); // will hold the submitted data

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((f) => ({ ...f, [id]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name.";
    if (!form.email.trim()) {
      e.email = "Please enter your email.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      e.email = "Please enter a valid email.";
    }
    if (!form.message.trim()) e.message = "Please enter a message.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // If you later connect this to an API, do it here.
    // For now, we just show an acknowledgement with the submitted values.
    setSubmitted({ ...form, submittedAt: new Date().toISOString() });
  };

  // Acknowledgement view
  if (submitted) {
    return (
      <main className="bg-bg min-h-[60vh] flex items-center justify-center">
        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 w-full">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-primary">Contact Us</h1>
            <p className="mt-2 opacity-70">
              Thanks for reaching out — we’ve received your message.
            </p>
          </header>

          <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-bg/50 p-6">
            <h2 className="text-xl font-semibold">Acknowledgement</h2>
            <p className="mt-2 opacity-80">
              We’ll get back to you shortly. Here’s what you sent:
            </p>
            <div className="mt-6 space-y-3">
              <div>
                <div className="text-sm opacity-70">Name</div>
                <div className="font-medium">{submitted.name}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Email</div>
                <div className="font-medium">{submitted.email}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Message</div>
                <div className="font-medium whitespace-pre-wrap">
                  {submitted.message}
                </div>
              </div>
            </div>

            <button
              className="mt-6 rounded-xl bg-primary px-6 py-2 font-semibold text-white hover:opacity-90"
              onClick={() => {
                // reset to allow another submission
                setForm({ name: "", email: "", message: "" });
                setErrors({});
                setSubmitted(null);
              }}
            >
              Send another message
            </button>
          </div>
        </section>
      </main>
    );
  }

  // Form view
  return (
    <main className="bg-bg min-h-[60vh] flex items-center justify-center">
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 text-center w-full">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Contact Us</h1>
          <p className="mt-2 opacity-70">
            Have questions, feedback, or partnership ideas? We’d love to hear
            from you.
          </p>
        </header>

        <form
          className="mx-auto grid max-w-2xl gap-4 justify-items-center"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="w-full">
            <label
              className="block text-sm font-medium opacity-80 text-left"
              htmlFor="name"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              className={`mt-1 w-full rounded-xl border ${
                errors.name ? "border-red-500" : "border-primary/20"
              } bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40`}
              placeholder="Jane Doe"
              value={form.name}
              onChange={onChange}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium opacity-80 text-left"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className={`mt-1 w-full rounded-xl border ${
                errors.email ? "border-red-500" : "border-primary/20"
              } bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40`}
              placeholder="jane@example.com"
              value={form.email}
              onChange={onChange}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email}</p>
            )}
          </div>

          <div className="w-full">
            <label
              className="block text-sm font-medium opacity-80 text-left"
              htmlFor="message"
            >
              Message
            </label>
            <textarea
              id="message"
              rows={5}
              className={`mt-1 w-full rounded-xl border ${
                errors.message ? "border-red-500" : "border-primary/20"
              } bg-transparent px-3 py-2 outline-none focus:ring-2 focus:ring-primary/40`}
              placeholder="Tell us how we can help…"
              value={form.message}
              onChange={onChange}
            />
            {errors.message && (
              <p className="mt-1 text-sm text-red-400">{errors.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl bg-primary px-6 py-2 font-semibold text-white hover:opacity-90"
          >
            Send Message
          </button>
        </form>
      </section>
    </main>
  );
}
