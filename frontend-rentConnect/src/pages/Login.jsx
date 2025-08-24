import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

      localStorage.setItem("token", res.data.token);

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
        err.response?.data?.message || "Login failed. Please try again."
      );
    }
  }

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
      <h2 className="text-2xl font-semibold mb-6">Login</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          Email
          <input
            name="email"
            type="email"
            placeholder="Enter your email"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
        <label className="block mb-4">
          Password
          <input
            name="password"
            type="password"
            placeholder="Enter your password"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
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
