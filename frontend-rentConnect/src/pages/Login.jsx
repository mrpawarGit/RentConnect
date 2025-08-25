import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { setToken } from "../lib/auth";
import { API_BASE_URL } from "../lib/config";

export default function Login() {
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true); // Start loading

    const form = e.target;
    const data = {
      email: form.email.value.trim(), // Trim whitespace
      password: form.password.value,
    };

    // Basic validation
    if (!data.email || !data.password) {
      setErrorMsg("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, data);

      if (res.data && res.data.token) {
        setToken(res.data.token);

        // Improved JWT decoding with error handling
        try {
          const base64Url = res.data.token.split(".")[1];
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          );
          const payload = JSON.parse(jsonPayload);

          // Store user info in localStorage for easy access
          localStorage.setItem(
            "user",
            JSON.stringify({
              id: payload.id,
              role: payload.role,
              email: data.email,
            })
          );

          // Clear form
          form.reset();

          navigate("/dashboard", { replace: true }); // Use replace to prevent back button issues
        } catch (jwtError) {
          console.error("JWT decoding error:", jwtError);
          setErrorMsg("Invalid token received. Please try again.");
        }
      } else {
        setErrorMsg("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Enhanced error handling
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data?.error;

        if (status === 401) {
          setErrorMsg("Invalid email or password");
        } else if (status === 429) {
          setErrorMsg("Too many login attempts. Please try again later.");
        } else if (status >= 500) {
          setErrorMsg("Server error. Please try again later.");
        } else {
          setErrorMsg(message || "Login failed. Please try again.");
        }
      } else if (err.request) {
        // Network error
        setErrorMsg("Network error. Please check your connection.");
      } else {
        setErrorMsg("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false); // Stop loading
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
            <div className="mb-4 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
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
                disabled={isLoading} // Disable when loading
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isLoading} // Disable when loading
                  className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-2 my-auto h-8 px-2 rounded-md text-sm opacity-80 hover:opacity-100 disabled:opacity-50"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-current"
                  disabled={isLoading}
                />
                <span className="opacity-80">Remember me</span>
              </label>
              <Link
                to="/forgot"
                className="underline underline-offset-2 hover:no-underline opacity-80 hover:opacity-100"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover shadow transition text-center font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm opacity-80">
            New to RentConnect?{" "}
            <Link
              to="/register"
              className="underline underline-offset-2 hover:no-underline font-medium"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
