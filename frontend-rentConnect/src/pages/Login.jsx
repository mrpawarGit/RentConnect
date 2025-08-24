import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setToken } from "../lib/auth";

export default function Login() {
  const [errorMsg, setErrorMsg] = useState("");
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
    <section className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block mb-1">Email</span>
          <input
            name="email"
            type="email"
            required
            className="w-full border rounded px-3 py-2"
          />
        </label>
        <label className="block">
          <span className="block mb-1">Password</span>
          <input
            name="password"
            type="password"
            required
            className="w-full border rounded px-3 py-2"
          />
        </label>
        {errorMsg && (
          <p className="text-red-500 text-center mb-4">{errorMsg}</p>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-primary-light dark:bg-primary-dark text-background-light dark:text-background-dark rounded hover:brightness-90 transition"
        >
          Log In
        </button>
      </form>
    </section>
  );
}
