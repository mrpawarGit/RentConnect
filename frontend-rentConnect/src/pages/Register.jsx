import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../lib/api"; // ✅ Use your configured api instance
import { setToken } from "../lib/auth";

export default function Register() {
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false); // ✅ Add loading state
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true); // ✅ Start loading

    const form = e.target;
    const data = {
      name: form.name.value.trim(), // ✅ Trim whitespace
      email: form.email.value.trim(),
      password: form.password.value,
      role: form.role.value,
    };

    // ✅ Basic validation
    if (!data.name || !data.email || !data.password || !data.role) {
      setErrorMsg("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Use api instance instead of axios + API_BASE_URL
      const res = await api.post("/auth/register", data);

      if (res.data && res.data.token) {
        setToken(res.data.token);
        form.reset(); // ✅ Clear form
        navigate("/dashboard", { replace: true });
      } else {
        setErrorMsg("Registration successful but no token received");
      }
    } catch (err) {
      console.error("Registration error:", err);

      // ✅ Enhanced error handling
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || err.response.data?.error;

        if (status === 400) {
          setErrorMsg(message || "Invalid registration data");
        } else if (status === 409) {
          setErrorMsg("Email already exists. Please use a different email.");
        } else if (status >= 500) {
          setErrorMsg("Server error. Please try again later.");
        } else {
          setErrorMsg(message || "Registration failed. Please try again.");
        }
      } else if (err.request) {
        setErrorMsg("Network error. Please check your connection.");
      } else {
        setErrorMsg("Registration failed. Please try again.");
      }
    } finally {
      setIsLoading(false); // ✅ Stop loading
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

          {/* Error - ✅ Enhanced error styling */}
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
              <span className="block mb-1 text-sm font-medium">Name</span>
              <input
                name="name"
                type="text"
                required
                disabled={isLoading} // ✅ Disable when loading
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isLoading} // ✅ Disable when loading
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isLoading} // ✅ Disable when loading
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </label>

            <label className="block">
              <span className="block mb-1 text-sm font-medium">Role</span>
              <select
                name="role"
                required
                disabled={isLoading} // ✅ Disable when loading
                className="w-full rounded-xl border border-primary px-3 py-2 bg-bg outline-none focus:ring-2 focus:ring-offset-0 focus:ring-[color:var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="tenant">Tenant</option>
                <option value="landlord">Landlord</option>
              </select>
            </label>

            {/* ✅ Enhanced button with loading state */}
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
                  Creating account...
                </>
              ) : (
                "Register"
              )}
            </button>
          </form>

          {/* Bottom link */}
          <p className="mt-6 text-center text-sm opacity-80">
            Already have an account?{" "}
            <Link
              to="/login"
              className="underline underline-offset-2 hover:no-underline font-medium"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
