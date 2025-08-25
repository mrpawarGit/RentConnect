import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { setToken } from "../lib/auth";
import { API_BASE_URL } from "../lib/config";

export default function Register() {
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const form = e.target;
    const data = {
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
      role: form.role.value,
    };

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, data);
      setToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
    }
  }

  return (
    <section className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-bg border border-primary rounded-2xl shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-extrabold text-primary">
              Create your account
            </h1>
            <p className="text-sm opacity-70 mt-1">Join RentConnect today</p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-primary bg-bg p-3 text-sm">
              <span role="img" aria-label="warning" className="mr-2">
                ⚠️
              </span>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block mb-1 text-sm font-medium">Name</span>
              <input
                name="name"
                type="text"
                required
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)]"
                placeholder="Leo Messi"
              />
            </label>

            <label className="block">
              <span className="block mb-1 text-sm font-medium">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)]"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="block mb-1 text-sm font-medium">Password</span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)]"
                placeholder="••••••••"
              />
            </label>

            <label className="block">
              <span className="block mb-1 text-sm font-medium">Role</span>
              <select
                name="role"
                required
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)]"
              >
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
              </select>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary bg-primary-hover shadow transition text-center font-medium"
            >
              Register
            </button>
          </form>

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm opacity-80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="underline underline-offset-2 hover:no-underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
