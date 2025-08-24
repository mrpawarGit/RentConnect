import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { setToken } from "../lib/auth";

export default function Login() {
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    const form = e.target;
    const data = {
      email: form.email.value,
      password: form.password.value,
    };

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        data
      );
      setToken(res.data.token);

      // Decode JWT if you need the role later (safe to keep or remove)
      const base64Url = res.data.token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const { role } = JSON.parse(jsonPayload);

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
          "Login failed. Please check your credentials."
      );
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
              Welcome back
            </h1>
            <p className="text-sm opacity-70 mt-1">
              Sign in to your RentConnect account
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-4 rounded-lg border border-primary p-3 text-sm">
              <span role="img" aria-label="warning" className="mr-2">
                ⚠️
              </span>
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="block mb-1 text-sm font-medium">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0"
                placeholder="you@example.com"
                style={{ boxShadow: "0 0 0 0 var(--color-primary)" }}
              />
            </label>

            <label className="block">
              <span className="block mb-1 text-sm font-medium">Password</span>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded-md text-sm opacity-80 hover:opacity-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="accent-current" />
                <span className="opacity-80">Remember me</span>
              </label>
              <Link
                to="/forgot"
                className="underline underline-offset-2 hover:no-underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary bg-primary-hover shadow transition text-center font-medium"
            >
              Log In
            </button>
          </form>

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm opacity-80">
            New to RentConnect?{" "}
            <Link
              to="/register"
              className="underline underline-offset-2 hover:no-underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
