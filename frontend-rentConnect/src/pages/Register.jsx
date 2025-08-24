import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

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

      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed.");
    }
  }

  return (
    <section className="max-w-md mx-auto p-6 border rounded-lg shadow bg-background-light dark:bg-background-dark text-primary-light dark:text-primary-dark">
      <h2 className="text-2xl font-semibold mb-6">Register</h2>
      <form onSubmit={handleSubmit}>
        <label className="block mb-4">
          Full Name
          <input
            name="name"
            type="text"
            placeholder="Enter your full name"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
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
            placeholder="Create a password"
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
            required
          />
        </label>
        <label className="block mb-4">
          Role
          <select
            name="role"
            required
            className="w-full p-2 border rounded mt-1 bg-background-light dark:bg-background-dark border-primary-light dark:border-primary-dark text-primary-light dark:text-primary-dark"
          >
            <option value="">-- Select Role --</option>
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
