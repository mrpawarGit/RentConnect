import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { setToken } from "../lib/auth";

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
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        data
      );

      setToken(res.data.token);

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
    }
  }

  return (
    <section className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Register</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block mb-1">Name</span>
          <input
            name="name"
            type="text"
            required
            className="w-full border rounded px-3 py-2"
          />
        </label>
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
        <label className="block">
          <span className="block mb-1">Role</span>
          <select name="role" className="w-full border rounded px-3 py-2">
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
        </label>
        {errorMsg && (
          <p className="text-red-500 text-center mb-4">{errorMsg}</p>
        )}
        <button
          type="submit"
          className="w-full py-2 bg-primary-light dark:bg-primary-dark text-background-light dark:text-background-dark rounded hover:brightness-90 transition"
        >
          Register
        </button>
      </form>
    </section>
  );
}
